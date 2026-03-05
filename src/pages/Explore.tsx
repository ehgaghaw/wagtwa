import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Flame, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import UniverseFilter from '@/components/UniverseFilter';
import { type BrainrotUniverse } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useDexScreenerBatch } from '@/hooks/useDexScreener';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type Filter = 'trending' | 'new' | 'gainers';

const filters: { key: Filter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'trending', label: 'Live Trends', icon: Flame },
  { key: 'new', label: 'New', icon: Clock },
  { key: 'gainers', label: 'Top Gainers', icon: TrendingUp },
];

const formatMc = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const Explore = () => {
  const [filter, setFilter] = useState<Filter>('trending');
  const [search, setSearch] = useState('');
  const [universe, setUniverse] = useState<BrainrotUniverse>('All');
  const [rawCoins, setRawCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLaunchedCoins = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('launched_coins' as any).select('*').order('created_at', { ascending: false });
    setRawCoins((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLaunchedCoins();
    const channel = supabase
      .channel('launched-coins-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launched_coins' }, () => {
        fetchLaunchedCoins();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLaunchedCoins]);

  const mintAddresses = useMemo(() => rawCoins.map(c => c.mint_address).filter(Boolean), [rawCoins]);
  const { data: dexData, loading: dexLoading } = useDexScreenerBatch(mintAddresses);

  const coins = useMemo(() => {
    return rawCoins.map(c => {
      const live = c.mint_address ? dexData[c.mint_address] : null;
      return {
        ...c,
        price: live?.priceUsd ?? 0,
        priceChange24h: live?.priceChange24h ?? 0,
        marketCap: live?.marketCap ?? 0,
        volume24h: live?.volume24h ?? 0,
      };
    });
  }, [rawCoins, dexData]);

  const filtered = coins
    .filter(c => universe === 'All' || c.universe === universe)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.ticker.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (filter) {
        case 'gainers': return b.priceChange24h - a.priceChange24h;
        case 'new': return 0;
        default: return b.marketCap - a.marketCap;
      }
    });

  return (
    <div className="container py-6 max-w-5xl">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {filters.map(f => {
          const Icon = f.icon;
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && f.key === 'trending' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="mb-5">
        <UniverseFilter selected={universe} onChange={setUniverse} />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for trends..."
          className="pl-10 bg-card border-border text-sm h-10 rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Token list — Frenzy style */}
      <div className="space-y-0">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 py-5 border-b border-border">
              <Skeleton className="w-[72px] h-[72px] rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right space-y-2 pt-1">
                <Skeleton className="h-5 w-24 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm mb-2">No coins launched yet.</p>
            <Link to="/launch" className="text-primary text-sm hover:underline">Launch a Brainrot Character →</Link>
          </div>
        ) : (
          filtered.map((coin) => {
            const hasDex = dexData[coin.mint_address];
            return (
              <Link
                key={coin.id}
                to={coin.mint_address ? `/token/${coin.mint_address}` : `/coin/${coin.id}`}
                className="flex items-start gap-4 py-5 border-b border-border hover:bg-card/50 transition-colors group -mx-4 px-4"
              >
                {/* Thumbnail */}
                <div className="shrink-0">
                  {coin.image_url ? (
                    <img
                      src={coin.image_url}
                      alt={coin.name}
                      className="w-[72px] h-[72px] rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-[72px] h-[72px] rounded-lg bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground border border-border">
                      {coin.ticker?.charAt(0) || '?'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-[15px]">{coin.name}</span>
                    <span className="text-xs text-muted-foreground">{coin.ticker}</span>
                  </div>
                  {coin.description && (
                    <p className="text-sm text-foreground/80 mb-2 line-clamp-2 leading-snug">{coin.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {coin.mint_address?.slice(0, 4)}..pump
                    </span>
                    <span className="text-[11px] text-muted-foreground">{coin.universe}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(coin.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0 pt-0.5">
                  {dexLoading && !hasDex ? (
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-24 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  ) : coin.marketCap > 0 ? (
                    <>
                      <p className="text-[15px] font-bold text-foreground font-mono">{formatMc(coin.marketCap)}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">V {formatMc(coin.volume24h)}</p>
                      <div className="flex items-center gap-2 justify-end mt-1.5">
                        {/* Progress bar */}
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.max(5, coin.marketCap / 1000))}%` }} />
                        </div>
                        <span className={`text-xs font-bold font-mono ${
                          coin.priceChange24h >= 0 ? 'text-primary' : 'text-destructive'
                        }`}>
                          {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not listed</p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Explore;
