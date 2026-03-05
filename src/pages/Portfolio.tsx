import { Wallet, TrendingUp, TrendingDown, Coins, History } from 'lucide-react';
import { mockCoins, mockTrades } from '@/data/mockData';
import { Link } from 'react-router-dom';
import BondingCurveBar from '@/components/BondingCurveBar';
import CoinAvatar from '@/components/CoinAvatar';

const holdings = mockCoins.slice(0, 4).map(c => ({
  ...c,
  amount: Math.floor(Math.random() * 100000),
  avgBuy: c.price * (0.7 + Math.random() * 0.6),
}));

const Portfolio = () => {
  const totalValue = holdings.reduce((s, h) => s + h.amount * h.price, 0);

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Portfolio</h1>

      {/* Wallet */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">DgN4...x9Rq</span>
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Connected</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="font-display text-xl font-bold text-primary">${totalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SOL Balance</p>
            <p className="text-lg font-bold">12.45 SOL</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tokens Held</p>
            <p className="text-lg font-bold">{holdings.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Coins Created</p>
            <p className="text-lg font-bold">2</p>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5 text-secondary" />
          <h2 className="font-display text-lg font-bold">Holdings</h2>
        </div>
        <div className="space-y-3">
          {holdings.map(h => {
            const pnl = ((h.price - h.avgBuy) / h.avgBuy) * 100;
            return (
              <Link key={h.id} to={`/coin/${h.id}`} className="block glass-card rounded-xl p-4 transition-all duration-300 hover:border-primary/30">
                <div className="flex items-center gap-4">
                  <CoinAvatar coin={h} size={40} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold">{h.name}</span>
                      <span className="text-xs text-muted-foreground">${h.ticker}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{h.amount.toLocaleString()} tokens</span>
                      <span>Value: ${(h.amount * h.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${h.price.toFixed(6)}</p>
                    <p className={`text-xs flex items-center justify-end gap-1 font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <BondingCurveBar progress={h.bondingProgress} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Trades */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-display text-lg font-bold">Transaction History</h2>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          {mockTrades.slice(0, 8).map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-xs border-b border-border/50 last:border-0">
              <span className={t.type === 'buy' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{t.type.toUpperCase()}</span>
              <span className="text-muted-foreground">{t.amount} SOL</span>
              <span className="text-foreground">${t.price}</span>
              <span className="text-muted-foreground">{t.wallet}</span>
              <span className="text-muted-foreground">{t.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
