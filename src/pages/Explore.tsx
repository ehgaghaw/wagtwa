import { useState, useEffect, useCallback } from 'react';
import { Search, Flame, Clock, TrendingUp, BarChart3, GraduationCap, Loader2, Rocket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CoinCard from '@/components/CoinCard';
import UniverseFilter from '@/components/UniverseFilter';
import { type BrainrotUniverse, type BrainrotCoin } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

type Filter = 'trending' | 'new' | 'gainers' | 'volume' | 'graduating';

const filters: { key: Filter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'trending', label: 'Trending', icon: Flame },
  { key: 'new', label: 'New', icon: Clock },
  { key: 'gainers', label: 'Top Gainers', icon: TrendingUp },
  { key: 'volume', label: 'Top Volume', icon: BarChart3 },
  { key: 'graduating', label: 'Graduating', icon: GraduationCap },
];

const Explore = () => {
  const [filter, setFilter] = useState<Filter>('new');
  const [search, setSearch] = useState('');
  const [universe, setUniverse] = useState<BrainrotUniverse>('All');
  const [launchedCoins, setLaunchedCoins] = useState<BrainrotCoin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLaunchedCoins = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('launched_coins' as any).select('*').order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }
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
    }));
    setLaunchedCoins(mapped);
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

  const filtered = launchedCoins
    .filter(c => universe === 'All' || c.universe === universe)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.ticker.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container py-6">
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

      {loading && (
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading coins...
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(coin => <CoinCard key={coin.id} coin={coin} />)}
        </div>
      ) : !loading ? (
        <div className="text-center py-20 space-y-4">
          <Rocket className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No brainrot coins yet. Launch the first one.</p>
          <Link to="/launch">
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              <Rocket className="h-4 w-4 mr-2" /> Launch a Coin
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default Explore;
