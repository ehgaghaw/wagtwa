import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CoinCard from '@/components/CoinCard';
import { mockCoins } from '@/data/mockData';

type Filter = 'trending' | 'new' | 'gainers' | 'volume' | 'graduating';

const filters: { key: Filter; label: string }[] = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'new', label: '🆕 New' },
  { key: 'gainers', label: '📈 Top Gainers' },
  { key: 'volume', label: '💰 Top Volume' },
  { key: 'graduating', label: '🎓 Graduating' },
];

const Explore = () => {
  const [filter, setFilter] = useState<Filter>('trending');
  const [search, setSearch] = useState('');

  const filtered = mockCoins
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
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Explore Brainrot Coins</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ticker..."
            className="pl-10 bg-muted border-border font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(coin => <CoinCard key={coin.id} coin={coin} />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground font-mono">
          No coins found. The rot hasn't spread here yet. 🧠
        </div>
      )}
    </div>
  );
};

export default Explore;
