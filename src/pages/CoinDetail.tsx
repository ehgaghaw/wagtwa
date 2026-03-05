import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DexPairData {
  priceUsd: string;
  priceChange: { h1?: number; h6?: number; h24?: number };
  volume: { h24?: number };
  liquidity: { usd?: number };
  marketCap?: number;
  fdv?: number;
  txns: { h24?: { buys?: number; sells?: number } };
  baseToken: { name: string; symbol: string; address: string };
}

interface CoinDbData {
  id: string;
  name: string;
  ticker: string;
  description: string | null;
  image_url: string | null;
  wallet_address: string;
  mint_address: string | null;
  universe: string;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  created_at: string;
  initial_buy: number | null;
}

const formatNum = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const formatPrice = (n: number) => {
  if (n === 0) return '$0';
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.01) return `$${n.toFixed(8)}`;
  if (n < 1) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(2)}`;
};

const StatBox = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
    {children}
  </div>
);

const CoinDetail = () => {
  const { id, mintAddress: mintParam } = useParams();
  const [dbCoin, setDbCoin] = useState<CoinDbData | null>(null);
  const [dexData, setDexData] = useState<DexPairData | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dexLoading, setDexLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const mintAddress = mintParam || null;

  useEffect(() => {
    const fetchCoin = async () => {
      setDbLoading(true);
      let query = supabase.from('launched_coins' as any).select('*');
      if (mintAddress) {
        query = query.eq('mint_address', mintAddress);
      } else if (id) {
        query = query.eq('id', id);
      }
      const { data } = await query.single();
      setDbCoin(data as any);
      setDbLoading(false);
    };
    fetchCoin();
  }, [id, mintAddress]);

  const fetchDex = useCallback(async (addr: string) => {
    setDexLoading(true);
    try {
      const res = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${addr}`);
      if (!res.ok) { setDexLoading(false); return; }
      const json = await res.json();
      const pairs = Array.isArray(json) ? json : json?.pairs || [];
      if (pairs.length > 0) {
        const best = pairs.reduce((a: any, b: any) =>
          (b.liquidity?.usd || 0) > (a.liquidity?.usd || 0) ? b : a, pairs[0]);
        setDexData(best);
      }
    } catch (e) {
      console.error('DexScreener error:', e);
    }
    setDexLoading(false);
  }, []);

  useEffect(() => {
    const addr = mintAddress || dbCoin?.mint_address;
    if (addr) {
      fetchDex(addr);
      const interval = setInterval(() => fetchDex(addr), 30_000);
      return () => clearInterval(interval);
    } else {
      setDexLoading(false);
    }
  }, [mintAddress, dbCoin?.mint_address, fetchDex]);

  const handleCopy = () => {
    const addr = mintAddress || dbCoin?.mint_address;
    if (addr) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Full page skeleton
  if (dbLoading) {
    return (
      <div className="container py-8 max-w-3xl">
        <Skeleton className="h-4 w-28 mb-8" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-20 h-20 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-lg mb-6" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <Skeleton className="h-3 w-14 mb-2" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!dbCoin) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        <p className="text-base mb-2">Token not found</p>
        <Link to="/explore" className="text-primary text-sm hover:underline">← Back to Explore</Link>
      </div>
    );
  }

  const tokenAddr = mintAddress || dbCoin.mint_address;
  const price = dexData ? parseFloat(dexData.priceUsd || '0') : null;
  const mc = dexData?.marketCap || dexData?.fdv || null;
  const vol = dexData?.volume?.h24 || null;
  const liq = dexData?.liquidity?.usd || null;
  const change24h = dexData?.priceChange?.h24 ?? null;
  const change1h = dexData?.priceChange?.h1 ?? null;
  const change6h = dexData?.priceChange?.h6 ?? null;
  const buys24 = dexData?.txns?.h24?.buys ?? null;
  const sells24 = dexData?.txns?.h24?.sells ?? null;

  return (
    <div className="container py-8 max-w-3xl">
      <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {dbCoin.image_url ? (
          <img src={dbCoin.image_url} alt={dbCoin.name} className="w-20 h-20 rounded-xl object-cover border border-border" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground border border-border">
            {dbCoin.ticker.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">{dbCoin.name}</h1>
          <p className="text-sm text-muted-foreground">${dbCoin.ticker} · {dbCoin.universe}</p>
          {tokenAddr && (
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1.5 transition-colors font-mono">
              {tokenAddr.slice(0, 8)}...{tokenAddr.slice(-6)}
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {dbCoin.description && (
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{dbCoin.description}</p>
      )}

      {/* Price banner */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5">
        {dexLoading ? (
          <div className="flex items-end gap-4">
            <div>
              <Skeleton className="h-3 w-10 mb-2" />
              <Skeleton className="h-10 w-44" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ) : price !== null && price > 0 ? (
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Price</p>
              <p className="text-3xl font-bold text-foreground font-mono">{formatPrice(price)}</p>
            </div>
            {change1h !== null && (
              <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${change1h >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {change1h >= 0 ? '+' : ''}{change1h.toFixed(2)}% 1h
              </span>
            )}
            {change6h !== null && (
              <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${change6h >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {change6h >= 0 ? '+' : ''}{change6h.toFixed(2)}% 6h
              </span>
            )}
            {change24h !== null && (
              <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${change24h >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% 24h
              </span>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Price</p>
            <p className="text-sm text-muted-foreground">Not yet listed on DEX</p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox label="Market Cap">
          {dexLoading ? <Skeleton className="h-6 w-24" /> :
            mc ? <p className="text-lg font-bold text-foreground font-mono">{formatNum(mc)}</p> :
            <p className="text-sm text-muted-foreground">—</p>}
        </StatBox>
        <StatBox label="24h Volume">
          {dexLoading ? <Skeleton className="h-6 w-24" /> :
            vol ? <p className="text-lg font-bold text-foreground font-mono">{formatNum(vol)}</p> :
            <p className="text-sm text-muted-foreground">—</p>}
        </StatBox>
        <StatBox label="Liquidity">
          {dexLoading ? <Skeleton className="h-6 w-24" /> :
            liq ? <p className="text-lg font-bold text-foreground font-mono">{formatNum(liq)}</p> :
            <p className="text-sm text-muted-foreground">—</p>}
        </StatBox>
        <StatBox label="24h Transactions">
          {dexLoading ? <Skeleton className="h-6 w-24" /> :
            buys24 !== null && sells24 !== null ? (
              <div>
                <p className="text-lg font-bold text-foreground font-mono">{(buys24 + sells24).toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-primary">{buys24} buys</span>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <span className="text-[10px] font-mono text-destructive">{sells24} sells</span>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
        </StatBox>
      </div>

      {/* Buy/Sell ratio bar */}
      {!dexLoading && buys24 !== null && sells24 !== null && (buys24 + sells24) > 0 && (
        <div className="bg-card border border-border rounded-lg p-3 mb-5">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Buyers</span>
            <span>Sellers</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
            <div className="h-full bg-primary rounded-l-full" style={{ width: `${(buys24 / (buys24 + sells24)) * 100}%` }} />
            <div className="h-full bg-destructive rounded-r-full flex-1" />
          </div>
        </div>
      )}

      {/* Chart */}
      {tokenAddr && (
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
          <div className="flex items-center justify-between px-4 pt-3">
            <p className="text-xs font-semibold text-foreground">Chart</p>
            <a
              href={`https://dexscreener.com/solana/${tokenAddr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> DexScreener
            </a>
          </div>
          <iframe
            src={`https://dexscreener.com/solana/${tokenAddr}?embed=1&theme=dark&info=0`}
            className="w-full h-[400px] border-0"
            title="Chart"
            allow="clipboard-write"
          />
        </div>
      )}

      {/* Links */}
      <div className="flex gap-2 flex-wrap mb-5">
        {tokenAddr && (
          <>
            <a href={`https://pump.fun/${tokenAddr}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
              <ExternalLink className="h-3 w-3" /> Pump.fun
            </a>
            <a href={`https://solscan.io/token/${tokenAddr}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
              <ExternalLink className="h-3 w-3" /> Solscan
            </a>
            <a href={`https://dexscreener.com/solana/${tokenAddr}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
              <ExternalLink className="h-3 w-3" /> DexScreener
            </a>
          </>
        )}
        {dbCoin.twitter && (
          <a href={dbCoin.twitter} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
            <ExternalLink className="h-3 w-3" /> Twitter
          </a>
        )}
        {dbCoin.telegram && (
          <a href={dbCoin.telegram} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
            <ExternalLink className="h-3 w-3" /> Telegram
          </a>
        )}
        {dbCoin.website && (
          <a href={dbCoin.website} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
            <ExternalLink className="h-3 w-3" /> Website
          </a>
        )}
      </div>

      {/* Token meta */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs font-semibold text-foreground mb-3">Token Info</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Creator</span>
            <span className="font-mono text-foreground">{dbCoin.wallet_address.slice(0, 8)}...{dbCoin.wallet_address.slice(-4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Universe</span>
            <span className="text-foreground">{dbCoin.universe}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Launched</span>
            <span className="text-foreground">{new Date(dbCoin.created_at).toLocaleDateString()}</span>
          </div>
          {dbCoin.initial_buy !== null && dbCoin.initial_buy > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Buy</span>
              <span className="text-foreground font-mono">{dbCoin.initial_buy} SOL</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
