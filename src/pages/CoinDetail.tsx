import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, ExternalLink, Send, Loader2, AlertTriangle, Zap, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { tradeToken } from '@/services/pumpPortal';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DexPairData {
  priceUsd: string;
  priceNative: string;
  priceChange: { h1?: number; h6?: number; h24?: number };
  volume: { h24?: number };
  liquidity: { usd?: number };
  marketCap?: number;
  fdv?: number;
  txns: { h24?: { buys?: number; sells?: number } };
  pairAddress?: string;
  baseToken: { name: string; symbol: string; address: string };
  info?: { imageUrl?: string; websites?: { url: string }[]; socials?: { type: string; url: string }[] };
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
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.01) return `$${n.toFixed(8)}`;
  if (n < 1) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(2)}`;
};

const StatSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-4">
    <Skeleton className="h-3 w-16 mb-2" />
    <Skeleton className="h-6 w-24" />
  </div>
);

const CoinDetail = () => {
  const { id, mintAddress: mintParam } = useParams();
  const [dbCoin, setDbCoin] = useState<CoinDbData | null>(null);
  const [dexData, setDexData] = useState<DexPairData | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dexLoading, setDexLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [buyAmount, setBuyAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [isTrading, setIsTrading] = useState(false);
  const [selectedSlippage, setSelectedSlippage] = useState('10');
  const wallet = useWallet();
  const { connection } = useConnection();

  const mintAddress = mintParam || null;

  // Fetch from DB
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

  // Fetch from DexScreener
  const fetchDex = useCallback(async (addr: string) => {
    setDexLoading(true);
    try {
      const res = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${addr}`);
      if (!res.ok) { setDexLoading(false); return; }
      const json = await res.json();
      const pairs = Array.isArray(json) ? json : json?.pairs || [];
      if (pairs.length > 0) {
        // Pick highest liquidity pair
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

  const handleTrade = async () => {
    const addr = mintAddress || dbCoin?.mint_address;
    if (!wallet.connected || !wallet.publicKey) {
      toast({ title: 'Connect your wallet first', variant: 'destructive' });
      return;
    }
    if (!buyAmount || parseFloat(buyAmount) <= 0 || !addr) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setIsTrading(true);
    try {
      const signature = await tradeToken(wallet, connection, {
        action: activeTab,
        mint: addr,
        amount: parseFloat(buyAmount),
        denominatedInSol: activeTab === 'buy',
        slippage: parseFloat(selectedSlippage),
      });
      toast({
        title: `${activeTab === 'buy' ? 'Buy' : 'Sell'} successful!`,
        description: (
          <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noopener noreferrer" className="underline">
            View on Solscan
          </a>
        ),
      });
      setBuyAmount('');
    } catch (err: any) {
      toast({ title: 'Trade failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsTrading(false);
    }
  };

  // Loading state
  if (dbLoading) {
    return (
      <div className="container py-8 max-w-6xl">
        <Skeleton className="h-5 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <StatSkeleton key={i} />)}
            </div>
          </div>
          <div><Skeleton className="h-[300px] rounded-xl" /></div>
        </div>
      </div>
    );
  }

  if (!dbCoin) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">Token not found</p>
        <p className="text-sm">It may not have been launched through this platform.</p>
        <Link to="/explore" className="text-primary text-sm hover:underline mt-4 inline-block">← Back to Explore</Link>
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
  const buys24 = dexData?.txns?.h24?.buys ?? null;
  const sells24 = dexData?.txns?.h24?.sells ?? null;
  const ticker = dbCoin.ticker;

  return (
    <div className="container py-8 max-w-6xl">
      <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            {dbCoin.image_url ? (
              <img src={dbCoin.image_url} alt={dbCoin.name} className="w-16 h-16 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {dbCoin.ticker.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground truncate">{dbCoin.name}</h1>
                <span className="text-sm text-primary font-semibold">${ticker}</span>
              </div>
              {tokenAddr && (
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors">
                  <span className="font-mono">{tokenAddr.slice(0, 6)}...{tokenAddr.slice(-4)}</span>
                  {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
              {dbCoin.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{dbCoin.description}</p>}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">Universe: <span className="text-foreground">{dbCoin.universe}</span></span>
                <span className="text-xs text-muted-foreground">Created {new Date(dbCoin.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Price banner */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-end gap-4 flex-wrap">
              {dexLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ) : price !== null ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Price</p>
                  <p className="text-3xl font-bold text-foreground font-mono">{formatPrice(price)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Price</p>
                  <p className="text-sm text-muted-foreground">Not yet listed on DEX</p>
                </div>
              )}
              {!dexLoading && change24h !== null && (
                <div className={`text-sm font-bold px-2 py-1 rounded ${change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% (24h)
                </div>
              )}
              {!dexLoading && change1h !== null && (
                <div className={`text-xs font-semibold px-2 py-1 rounded ${change1h >= 0 ? 'bg-emerald-500/5 text-emerald-400/70' : 'bg-red-500/5 text-red-400/70'}`}>
                  {change1h >= 0 ? '+' : ''}{change1h.toFixed(2)}% (1h)
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Market Cap', value: mc, format: (n: number) => formatNum(n) },
              { label: '24h Volume', value: vol, format: (n: number) => formatNum(n) },
              { label: 'Liquidity', value: liq, format: (n: number) => formatNum(n) },
              { label: '24h Txns', value: buys24 !== null && sells24 !== null ? buys24 + sells24 : null, format: (n: number) => `${n.toLocaleString()}` },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                {dexLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : stat.value !== null ? (
                  <p className="text-lg font-bold text-foreground font-mono">{stat.format(stat.value)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            ))}
          </div>

          {/* Buy/Sell breakdown */}
          {!dexLoading && buys24 !== null && sells24 !== null && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">24h Buy/Sell Ratio</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(buys24 / Math.max(buys24 + sells24, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-emerald-400">{buys24}B</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs font-mono text-red-400">{sells24}S</span>
              </div>
            </div>
          )}

          {/* DexScreener Chart */}
          {tokenAddr && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 pb-0">
                <h3 className="text-sm font-bold text-foreground">Price Chart</h3>
                <a
                  href={`https://dexscreener.com/solana/${tokenAddr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> DexScreener
                </a>
              </div>
              <iframe
                src={`https://dexscreener.com/solana/${tokenAddr}?embed=1&theme=dark&info=0`}
                className="w-full h-[420px] border-0"
                title="DexScreener Chart"
                allow="clipboard-write"
              />
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2 flex-wrap">
            {tokenAddr && (
              <>
                <a href={`https://pump.fun/${tokenAddr}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" /> Pump.fun
                </a>
                <a href={`https://solscan.io/token/${tokenAddr}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" /> Solscan
                </a>
              </>
            )}
            {dbCoin.twitter && (
              <a href={dbCoin.twitter} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3" /> Twitter
              </a>
            )}
            {dbCoin.telegram && (
              <a href={dbCoin.telegram} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3" /> Telegram
              </a>
            )}
            {dbCoin.website && (
              <a href={dbCoin.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3" /> Website
              </a>
            )}
          </div>
        </div>

        {/* Buy/Sell Panel */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
            <div className="flex gap-2 mb-4">
              {(['buy', 'sell'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === tab
                      ? tab === 'buy' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Amount ({activeTab === 'buy' ? 'SOL' : ticker})
                </label>
                <Input
                  type="number"
                  placeholder="0.0"
                  className="bg-muted border-border"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {(activeTab === 'buy' ? ['0.1', '0.5', '1', '5'] : ['25%', '50%', '75%', '100%']).map(v => (
                  <button
                    key={v}
                    onClick={() => setBuyAmount(v.replace('%', ''))}
                    className="flex-1 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors font-medium"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Slippage</label>
                <div className="flex gap-2">
                  {['1', '5', '10', '20'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSlippage(s)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-all duration-200 font-medium ${
                        selectedSlippage === s
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-muted hover:bg-muted/80 border-border'
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>

              {buyAmount && price && activeTab === 'buy' && (
                <div className="text-xs text-muted-foreground">
                  Est. output: ~{(parseFloat(buyAmount || '0') / price).toLocaleString()} ${ticker}
                </div>
              )}

              {!wallet.connected && (
                <p className="text-xs text-destructive text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Connect wallet to trade
                </p>
              )}

              <Button
                onClick={handleTrade}
                disabled={isTrading || !wallet.connected || !buyAmount || !tokenAddr}
                className={`w-full font-bold rounded-xl ${
                  activeTab === 'buy'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                } disabled:opacity-50`}
              >
                {isTrading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  activeTab === 'buy' ? `Buy $${ticker}` : `Sell $${ticker}`
                )}
              </Button>
            </div>
          </div>

          {/* Token Info */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Token Info</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creator</span>
                <span className="font-mono text-foreground">{dbCoin.wallet_address.slice(0, 6)}...{dbCoin.wallet_address.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Universe</span>
                <span className="text-foreground">{dbCoin.universe}</span>
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
      </div>
    </div>
  );
};

export default CoinDetail;
