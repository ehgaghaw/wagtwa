import { mockCoins } from '@/data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TickerBar = () => {
  const items = [...mockCoins, ...mockCoins];
  return (
    <div className="border-b overflow-hidden py-3" style={{ background: 'hsl(0 0% 4% / 0.8)', borderBottomColor: 'hsl(135 100% 50% / 0.1)', boxShadow: '0 2px 12px hsl(135 100% 50% / 0.05)' }}>
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((coin, i) => (
          <div key={`${coin.id}-${i}`} className="flex items-center gap-2 mx-4 text-xs font-mono">
            <span>{coin.image}</span>
            <span className="text-foreground font-bold">${coin.ticker}</span>
            <span className="text-muted-foreground">${coin.price.toFixed(6)}</span>
            <span className={`flex items-center gap-0.5 ${coin.priceChange24h >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {coin.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
            </span>
            <span className="text-muted-foreground/30 mx-2">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
