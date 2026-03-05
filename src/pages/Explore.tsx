import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import UniverseFilter from '@/components/UniverseFilter';
import { type BrainrotUniverse } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useDexScreenerBatch } from '@/hooks/useDexScreener';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type Filter = 'live' | 'trending';

const formatMc = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const shortenAddr = (addr: string) => `${addr.slice(0, 4)}..pump`;
const shortenWallet = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const Explore = () => {
  const [filter, setFilter] = useState<Filter>('live');
  const [search, setSearch] = useState('');
  const [universe, setUniverse] = useState<BrainrotUniverse>('All');
  const [rawCoins, setRawCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLaunchedCoins = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('launched_coins').select('*').order('created_at', { ascending: false });
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
        case 'trending': return b.marketCap - a.marketCap;
        default: return 0; // keep newest first
      }
    });

  return (
    <div className="container py-6 max-w-4xl">
      {/* Tabs — exactly like Frenzy: "Live Trends •" and "Trending" */}
      <div className="flex items-center gap-6 mb-6">
        <button
          onClick={() => setFilter('live')}
          className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            filter === 'live' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Live Trends
          {filter === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>
        <button
          onClick={() => setFilter('trending')}
          className={`text-sm font-semibold transition-colors ${
            filter === 'trending' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Trending
        </button>
      </div>

      {/* Universe filter */}
      <div className="mb-5">
        <UniverseFilter selected={universe} onChange={setUniverse} />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for trends..."
          className="pl-10 bg-card border-border text-sm h-10 rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Token list — Frenzy layout */}
      <div>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-border">
              <div className="shrink-0">
                <Skeleton className="w-[72px] h-[72px] rounded-lg" />
                <Skeleton className="h-3 w-14 mt-1.5 mx-auto" />
              </div>
              <div className="flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="text-right space-y-2 pt-0.5 shrink-0">
                <Skeleton className="h-5 w-20 ml-auto" />
                <Skeleton className="h-3 w-14 ml-auto" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm mb-2">No coins launched yet.</p>
            <Link to="/launch" className="text-primary text-sm hover:underline">Launch a Brainrot Character</Link>
          </div>
        ) : (
          filtered.map((coin) => {
            const hasDex = dexData[coin.mint_address];
            // ATH approximation — use marketCap as proxy since we don't track ATH
            const athValue = coin.marketCap > 0 ? coin.marketCap * (1 + Math.abs(coin.priceChange24h) / 100) : 0;
            const athProgress = athValue > 0 ? Math.min(100, (coin.marketCap / athValue) * 100) : 0;

            return (
              <Link
                key={coin.id}
                to={coin.mint_address ? `/token/${coin.mint_address}` : `/coin/${coin.id}`}
                className="flex items-start gap-4 py-4 border-b border-border hover:bg-card/40 transition-colors -mx-4 px-4"
              >
                {/* Thumbnail column */}
                <div className="shrink-0 w-[72px]">
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
                  {/* Address below thumbnail */}
                  {coin.mint_address && (
                    <p className="text-[10px] text-muted-foreground font-mono text-center mt-1">
                      {shortenAddr(coin.mint_address)}
                    </p>
                  )}
                </div>

                {/* Center info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* Name + ticker row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-[15px]">{coin.name}</span>
                    <span className="text-xs text-muted-foreground">{coin.ticker}</span>
                  </div>
                  {/* Description */}
                  {coin.description && (
                    <p className="text-sm text-foreground/80 leading-snug mb-2 line-clamp-1">{coin.description}</p>
                  )}
                  {/* Creator row — like Frenzy: avatar dot + @wallet + universe + time */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-muted border border-border" />
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {shortenWallet(coin.wallet_address)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{coin.universe}</span>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(coin.created_at)}</span>
                  </div>
                </div>

                {/* Right stats */}
                <div className="text-right shrink-0 pt-0.5 min-w-[120px]">
                  {dexLoading && !hasDex ? (
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-20 ml-auto" />
                      <Skeleton className="h-3 w-14 ml-auto" />
                    </div>
                  ) : coin.marketCap > 0 ? (
                    <>
                      <p className="text-[15px] font-bold text-foreground font-mono">{formatMc(coin.marketCap)}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">V {formatMc(coin.volume24h)}</p>
                      {/* ATH bar + ATH value + change — like Frenzy */}
                      <div className="flex items-center gap-1.5 justify-end mt-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.max(5, athProgress)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">ATH {formatMc(athValue)}</span>
                        <span className={`text-[11px] font-bold font-mono ${
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
