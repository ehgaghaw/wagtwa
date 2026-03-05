import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { BrainrotCoin } from '@/data/mockData';
import CoinAvatar from './CoinAvatar';

const formatNum = (n: number) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const CoinCard = ({ coin }: { coin: BrainrotCoin }) => (
  <Link
    to={`/coin/${coin.id}`}
    className="block bg-card border border-border rounded-md p-4 hover:border-muted-foreground/30 hover:-translate-y-0.5 transition-all duration-200 group"
  >
    <div className="flex items-start gap-3 mb-3">
      <CoinAvatar coin={coin} size={40} />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {coin.name}
        </h3>
        <p className="text-xs text-muted-foreground">${coin.ticker}</p>
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold font-mono-num ${
        coin.priceChange24h >= 0 ? 'text-positive' : 'text-negative'
      }`}>
        {coin.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
      <div>
        <span className="text-muted-foreground block">Price</span>
        <span className="text-foreground font-semibold font-mono-num">${coin.price.toFixed(6)}</span>
      </div>
      <div>
        <span className="text-muted-foreground block">MCap</span>
        <span className="text-foreground font-semibold font-mono-num">{formatNum(coin.marketCap)}</span>
      </div>
      <div>
        <span className="text-muted-foreground block">Vol</span>
        <span className="text-foreground font-semibold font-mono-num">{formatNum(coin.volume24h)}</span>
      </div>
    </div>
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Bonding</span>
        <span className="text-foreground font-semibold font-mono-num">{coin.bondingProgress}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${coin.bondingProgress}%` }}
        />
      </div>
    </div>
  </Link>
);

export default CoinCard;
