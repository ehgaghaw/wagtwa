import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check, Heart, Eye, Share2 } from 'lucide-react';
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
  creator_display: string;
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

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

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
      const { data, error } = await supabase.functions.invoke('character-vote', {
        body: { action: 'coin', id: id || null, mintAddress: mintAddress || null },
      });

      if (error || !data) {
        setDbCoin(null);
      } else {
        setDbCoin(((data as any).coin as CoinDbData) || null);
      }
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

  if (dbLoading) {
    return (
      <div className="container py-8 max-w-3xl">
        <Skeleton className="h-4 w-16 mb-8" />
        <div className="flex items-start gap-4 mb-6">
          <Skeleton className="w-[140px] h-[140px] rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-full max-w-md" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!dbCoin) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        <p className="text-base mb-2">Token not found</p>
        <Link to="/explore" className="text-primary text-sm hover:underline">Back to Explore</Link>
      </div>
    );
  }

  const tokenAddr = mintAddress || dbCoin.mint_address;
  const mc = dexData?.marketCap || dexData?.fdv || null;
  const vol = dexData?.volume?.h24 || null;
  const change24h = dexData?.priceChange?.h24 ?? null;
  const buys24 = dexData?.txns?.h24?.buys ?? 0;
  const sells24 = dexData?.txns?.h24?.sells ?? 0;
  const totalTxns = buys24 + sells24;

  return (
    <div className="container py-8 max-w-3xl">
      {/* Back link */}
      <Link to="/explore" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>

      {/* Top row: name + ticker left, change + mcap right — Frenzy style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-base">{dbCoin.name}</span>
          <span className="text-sm text-muted-foreground">{dbCoin.ticker}</span>
        </div>
        {!dexLoading && mc !== null && mc > 0 && (
          <div className="flex items-center gap-2">
            {change24h !== null && (
              <span className={`text-xs font-bold font-mono ${change24h >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </span>
            )}
            <span className="text-base font-bold text-foreground font-mono">{formatNum(mc)}</span>
          </div>
        )}
      </div>

      {/* Image + Headline row — matching Frenzy detail: square image with colored border, headline to the right */}
      <div className="flex items-start gap-5 mb-4">
        {dbCoin.image_url ? (
          <img
            src={dbCoin.image_url}
            alt={dbCoin.name}
            className="w-[140px] h-[140px] rounded-lg object-cover border-[3px] border-primary/60 shrink-0"
          />
        ) : (
          <div className="w-[140px] h-[140px] rounded-lg bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground border-[3px] border-primary/60 shrink-0">
            {dbCoin.ticker.charAt(0)}
          </div>
        )}
        <div className="flex-1 pt-1">
          <h1 className="text-xl font-bold text-foreground leading-snug mb-3">
            {dbCoin.description || dbCoin.name}
          </h1>
          {/* Stats row — hearts, views, shares, time — like Frenzy */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1 text-xs">
              <Heart className="h-3.5 w-3.5" /> {totalTxns > 0 ? totalTxns.toLocaleString() : '—'}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Eye className="h-3.5 w-3.5" /> {vol ? formatNum(vol) : '—'}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Share2 className="h-3.5 w-3.5" /> {buys24 > 0 ? buys24.toLocaleString() : '—'}
            </span>
            {tokenAddr && (
              <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-mono">
                {tokenAddr.slice(0, 4)}..pump
                {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
            <span className="text-xs">{timeAgo(dbCoin.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Summary section — like Frenzy */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-foreground mb-3">Summary</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {dbCoin.description || `${dbCoin.name} ($${dbCoin.ticker}) launched on the Brainrot Launchpad via Pump.fun's bonding curve on Solana.`}
        </p>
      </div>

      {/* Stats card — Heatcheck */}
      {!dexLoading && mc !== null && mc > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Market Cap', value: mc, fmt: formatNum },
              { label: 'Volume 24h', value: vol, fmt: formatNum },
              { label: 'Liquidity', value: dexData?.liquidity?.usd || null, fmt: formatNum },
              { label: 'Txns 24h', value: totalTxns > 0 ? totalTxns : null, fmt: (n: number) => n.toLocaleString() },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-[10px] text-muted-foreground mb-1">{stat.label}</p>
                {stat.value !== null ? (
                  <p className="text-base font-bold text-foreground font-mono">{stat.fmt(stat.value)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            ))}
          </div>

          {/* Price changes row */}
          {(dexData?.priceChange?.h1 !== undefined || dexData?.priceChange?.h6 !== undefined || change24h !== null) && (
            <div className="flex gap-3 mt-4 pt-3 border-t border-border">
              {[
                { label: '1h', value: dexData?.priceChange?.h1 },
                { label: '6h', value: dexData?.priceChange?.h6 },
                { label: '24h', value: change24h },
              ].filter(c => c.value !== undefined && c.value !== null).map(c => (
                <span key={c.label} className={`text-xs font-bold font-mono ${c.value! >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {c.value! >= 0 ? '+' : ''}{c.value!.toFixed(2)}% <span className="text-muted-foreground font-normal">{c.label}</span>
                </span>
              ))}
            </div>
          )}

          {/* Buy/Sell bar */}
          {buys24 > 0 && sells24 > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{buys24} buys</span>
                <span>{sells24} sells</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden flex bg-muted">
                <div className="h-full bg-primary" style={{ width: `${(buys24 / totalTxns) * 100}%` }} />
                <div className="h-full bg-destructive flex-1" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {tokenAddr && (
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
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

      {/* Read more — links section like Frenzy */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3">Read more</h2>
        <ul className="space-y-2">
          {tokenAddr && (
            <>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                <a href={`https://pump.fun/${tokenAddr}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1">
                  View on Pump.fun <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                <a href={`https://solscan.io/token/${tokenAddr}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1">
                  View on Solscan <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </>
          )}
          {dbCoin.twitter && (
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
              <a href={dbCoin.twitter} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1">
                Twitter / X <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          )}
          {dbCoin.telegram && (
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
              <a href={dbCoin.telegram} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1">
                Telegram <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          )}
          {dbCoin.website && (
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
              <a href={dbCoin.website} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1">
                Website <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          )}
        </ul>
      </div>

      {/* Token Info */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs font-semibold text-foreground mb-3">Token Info</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Creator</span>
            <span className="font-mono text-foreground">{dbCoin.creator_display || 'anonymous'}</span>
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
