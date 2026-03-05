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
    <div className="container py-6 max-w-4xl">
      <div className="mb-5">
        <UniverseFilter selected={universe} onChange={setUniverse} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for trends..."
            className="pl-10 bg-card border-border text-sm h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/50'
                }`}
              >
                {filter === f.key && f.key === 'trending' && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />}
                <Icon className="h-3 w-3" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coin list - Frenzy style */}
      <div className="space-y-0 border border-border rounded-xl overflow-hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0">
              <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-5 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No coins launched yet. Be the first to launch!
          </div>
        ) : (
          filtered.map((coin, idx) => (
            <Link
              key={coin.id}
              to={coin.mint_address ? `/token/${coin.mint_address}` : `/coin/${coin.id}`}
              className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group"
            >
              {/* Image */}
              <div className="relative shrink-0">
                {coin.image_url ? (
                  <img src={coin.image_url} alt={coin.name} className="w-14 h-14 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground border border-border">
                    {coin.ticker?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm truncate">{coin.name}</span>
                  <span className="text-xs text-muted-foreground">{coin.ticker}</span>
                </div>
                {coin.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{coin.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {coin.mint_address?.slice(0, 4)}...{coin.mint_address?.slice(-4)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{coin.universe}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0">
                {dexLoading && !dexData[coin.mint_address] ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-20 ml-auto" />
                    <Skeleton className="h-3 w-14 ml-auto" />
                  </div>
                ) : coin.marketCap > 0 ? (
                  <>
                    <p className="text-sm font-bold text-foreground font-mono">{formatMc(coin.marketCap)}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">V {formatMc(coin.volume24h)}</p>
                    <p className={`text-xs font-bold font-mono mt-0.5 ${
                      coin.priceChange24h >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not listed</p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Explore;
