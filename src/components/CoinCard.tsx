import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { BrainrotCoin } from '@/data/mockData';
import { motion } from 'framer-motion';

const formatNum = (n: number) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const CoinCard = ({ coin }: { coin: BrainrotCoin }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    <Link
      to={`/coin/${coin.id}`}
      className="block glass-card rounded-xl p-5 group transition-all duration-300"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg bg-muted/50">{coin.image}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {coin.name}
          </h3>
          <p className="text-xs text-muted-foreground">${coin.ticker}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          coin.priceChange24h >= 0 
            ? 'text-emerald-400 bg-emerald-400/10' 
            : 'text-red-400 bg-red-400/10'
        }`}>
          {coin.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs mb-4">
        <div>
          <span className="text-muted-foreground block mb-0.5">Price</span>
          <span className="text-foreground font-semibold">${coin.price.toFixed(6)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-0.5">MCap</span>
          <span className="text-foreground font-semibold">{formatNum(coin.marketCap)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-0.5">Volume</span>
          <span className="text-foreground font-semibold">{formatNum(coin.volume24h)}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Bonding Curve</span>
          <span className="text-foreground font-semibold">{coin.bondingProgress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${coin.bondingProgress}%`,
              background: 'linear-gradient(90deg, hsl(330 85% 60%), hsl(270 70% 55%))'
            }} 
          />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default CoinCard;
