import { useState, useEffect, useCallback } from 'react';
import { Search, Flame, Clock, TrendingUp, BarChart3, GraduationCap, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CoinCard from '@/components/CoinCard';
import UniverseFilter from '@/components/UniverseFilter';
import { type BrainrotUniverse, type BrainrotCoin } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

type Filter = 'trending' | 'new' | 'gainers' | 'volume' | 'graduating';

const filters: { key: Filter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'trending', label: 'Trending', icon: Flame },
  { key: 'new', label: 'New', icon: Clock },
  { key: 'gainers', label: 'Top Gainers', icon: TrendingUp },
  { key: 'volume', label: 'Top Volume', icon: BarChart3 },
  { key: 'graduating', label: 'Graduating', icon: GraduationCap },
];

interface DexToken {
  name: string;
  symbol: string;
  address: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  imageUrl?: string;
}

const fetchDexScreenerTokens = async (query: string = 'brainrot'): Promise<DexToken[]> => {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.pairs) return [];

    const seen = new Set<string>();
    const tokens: DexToken[] = [];

    for (const pair of data.pairs) {
      if (pair.chainId !== 'solana') continue;
      const addr = pair.baseToken?.address;
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);

      tokens.push({
        name: pair.baseToken.name || 'Unknown',
        symbol: pair.baseToken.symbol || '???',
        address: addr,
        priceUsd: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
        marketCap: pair.marketCap || pair.fdv || 0,
        imageUrl: pair.info?.imageUrl,
      });
    }
    return tokens.slice(0, 20);
  } catch {
    return [];
  }
};

const Explore = () => {
  const [filter, setFilter] = useState<Filter>('trending');
  const [search, setSearch] = useState('');
  const [universe, setUniverse] = useState<BrainrotUniverse>('All');
  const [dexTokens, setDexTokens] = useState<DexToken[]>([]);
  const [dexLoading, setDexLoading] = useState(false);
  const [useDex, setUseDex] = useState(false);
  const [launchedCoins, setLaunchedCoins] = useState<BrainrotCoin[]>([]);

  const fetchLaunchedCoins = useCallback(async () => {
    const { data } = await supabase.from('launched_coins' as any).select('*').order('created_at', { ascending: false });
    if (!data) return;
    const mapped: BrainrotCoin[] = (data as any[]).map((c, i) => ({
      id: c.id,
      name: c.name,
      ticker: c.ticker,
      description: c.description || '',
      image: c.image_url || '',
      avatarGradient: `linear-gradient(135deg, hsl(${(i * 53) % 360} 60% 45%), hsl(${(i * 53 + 40) % 360} 50% 55%))`,
      avatarLetter: c.ticker?.charAt(0) || c.name?.charAt(0) || '?',
      price: 0,
      priceChange24h: 0,
      marketCap: 0,
      volume24h: 0,
      bondingProgress: 0,
      creator: c.wallet_address,
      createdAt: new Date(c.created_at).toLocaleDateString(),
      holders: 0,
      tags: [],
      universe: (c.universe || 'Italian Brainrot') as BrainrotUniverse,
      mintAddress: c.mint_address,
    }));
    setLaunchedCoins(mapped);
  }, []);

  // Load DexScreener data
  const loadDex = useCallback(async (q: string) => {
    setDexLoading(true);
    const tokens = await fetchDexScreenerTokens(q);
    setDexTokens(tokens);
    setUseDex(tokens.length > 0);
    setDexLoading(false);
  }, []);

  useEffect(() => {
    loadDex('brainrot');
    fetchLaunchedCoins();

    const channel = supabase
      .channel('launched-coins-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launched_coins' }, () => {
        fetchLaunchedCoins();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDex, fetchLaunchedCoins]);

  // Convert dex tokens to BrainrotCoin format for CoinCard
  const dexAsCoins: BrainrotCoin[] = dexTokens.map((t, i) => ({
    id: `dex-${t.address}`,
    name: t.name,
    ticker: t.symbol,
    description: '',
    image: t.imageUrl || '',
    avatarGradient: `linear-gradient(135deg, hsl(${(i * 37) % 360} 60% 45%), hsl(${(i * 37 + 40) % 360} 50% 55%))`,
    avatarLetter: t.symbol.charAt(0),
    price: t.priceUsd,
    priceChange24h: t.priceChange24h,
    marketCap: t.marketCap,
    volume24h: t.volume24h,
    bondingProgress: Math.min(100, Math.floor((t.marketCap / 100000) * 100)),
    creator: t.address,
    createdAt: 'live',
    holders: 0,
    tags: [],
    universe: 'All' as BrainrotUniverse,
  }));

  // Combine launched coins + dex tokens
  const allCoins = [...launchedCoins, ...dexAsCoins];

  const filtered = allCoins
    .filter(c => universe === 'All' || c.universe === universe)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.ticker.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (filter) {
        case 'gainers': return b.priceChange24h - a.priceChange24h;
        case 'volume': return b.volume24h - a.volume24h;
        case 'graduating': return b.bondingProgress - a.bondingProgress;
        case 'new': return 0;
        default: return b.marketCap - a.marketCap;
      }
    });

  return (
    <div className="container py-6">
      {/* Universe Filter */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Brainrot Universes</p>
        <UniverseFilter selected={universe} onChange={setUniverse} />
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ticker..."
            className="pl-10 bg-card border-border text-sm h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 border ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/50'
                }`}
              >
                <Icon className="h-3 w-3" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {dexLoading && (
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading live token data...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(coin => <CoinCard key={coin.id} coin={coin} />)}
      </div>
      {filtered.length === 0 && !dexLoading && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No coins found.
        </div>
      )}
    </div>
  );
};

export default Explore;
