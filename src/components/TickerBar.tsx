import { mockCoins } from '@/data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TickerBar = () => {
  const items = [...mockCoins, ...mockCoins];
  return (
    <div className="border-b border-border bg-muted/20 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-2.5">
        {items.map((coin, i) => (
          <div key={`${coin.id}-${i}`} className="flex items-center gap-2 mx-6 text-xs">
            <span>{coin.image}</span>
            <span className="text-foreground font-semibold">${coin.ticker}</span>
            <span className="text-muted-foreground">${coin.price.toFixed(6)}</span>
            <span className={`flex items-center gap-0.5 font-medium ${
              coin.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {coin.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
