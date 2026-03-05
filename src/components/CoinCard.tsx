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

const CoinCard = ({ coin }: { coin: BrainrotCoin }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
  >
    <Link
      to={`/coin/${coin.id}`}
      className="block bg-card border border-border rounded-lg p-4 card-hover group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-4xl">{coin.image}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {coin.name}
          </h3>
          <p className="text-xs text-muted-foreground font-mono">${coin.ticker}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
          coin.priceChange24h >= 0 ? 'text-primary' : 'text-destructive'
        }`}>
          {coin.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
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
        className="w-full bg-primary text-primary-foreground font-display text-xs font-bold hover:bg-primary/90"
        onClick={(e) => { e.preventDefault(); }}
      >
        BUY ${coin.ticker}
      </Button>
    </Link>
  </motion.div>
);

export default CoinCard;
