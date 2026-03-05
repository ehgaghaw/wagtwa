import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BondingCurveBar from './BondingCurveBar';
import type { BrainrotCoin } from '@/data/mockData';
import { motion } from 'framer-motion';

const formatNum = (n: number) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const CoinCard = ({ coin }: { coin: BrainrotCoin }) => {
  const isPositive = coin.priceChange24h >= 0;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        to={`/coin/${coin.id}`}
        className={`block glass-card rounded-lg p-4 transition-all duration-300 group ${isPositive ? 'card-glow-green' : 'card-glow-red'}`}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="text-4xl flex-shrink-0">{coin.image}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300">
              {coin.name}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">${coin.ticker}</p>
          </div>
          <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
            isPositive ? 'text-primary' : 'text-destructive'
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
          <div><span className="block text-foreground font-mono">${coin.price.toFixed(6)}</span>Price</div>
          <div><span className="block text-foreground font-mono">{formatNum(coin.marketCap)}</span>MCap</div>
          <div><span className="block text-foreground font-mono">{formatNum(coin.volume24h)}</span>24h Vol</div>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Bonding Curve</span>
            <span className="text-foreground font-mono">{coin.bondingProgress}%</span>
          </div>
          <BondingCurveBar progress={coin.bondingProgress} />
        </div>
        <Button
          size="sm"
          className="w-full font-display text-xs font-bold transition-all duration-300 hover:shadow-[0_0_20px_hsl(135_100%_50%_/_0.3)]"
          style={{ background: 'linear-gradient(135deg, hsl(135 100% 45%), hsl(135 100% 55%))' }}
          onClick={(e) => { e.preventDefault(); }}
        >
          BUY ${coin.ticker}
        </Button>
      </Link>
    </motion.div>
  );
};

export default CoinCard;
