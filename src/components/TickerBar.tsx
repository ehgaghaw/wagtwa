import { mockCoins } from '@/data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';
import CoinAvatar from './CoinAvatar';

const TickerBar = () => {
  const items = [...mockCoins, ...mockCoins];
  return (
    <div className="border-b border-border bg-card overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-1.5">
        {items.map((coin, i) => (
          <div key={`${coin.id}-${i}`} className="flex items-center gap-1.5 mx-5 text-xs">
            <CoinAvatar coin={coin} size={16} />
            <span className="text-foreground font-medium">${coin.ticker}</span>
            <span className="text-muted-foreground font-mono-num">${coin.price.toFixed(6)}</span>
            <span className={`flex items-center gap-0.5 font-bold font-mono-num ${
              coin.priceChange24h >= 0 ? 'text-positive' : 'text-negative'
            }`}>
              {coin.priceChange24h >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
