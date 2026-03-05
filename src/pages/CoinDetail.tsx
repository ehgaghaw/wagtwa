import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BondingCurveBar from '@/components/BondingCurveBar';
import { mockCoins, mockTrades, mockChat, mockCandlestickData } from '@/data/mockData';
import { useState } from 'react';

const CoinDetail = () => {
  const { id } = useParams();
  const coin = mockCoins.find(c => c.id === id);
  const [buyAmount, setBuyAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [chatMsg, setChatMsg] = useState('');

  if (!coin) return (
    <div className="container py-20 text-center text-muted-foreground font-mono">
      Coin not found. It may have already rotted away. 💀
    </div>
  );

  const formatNum = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(1)}K` : `$${n}`;

  return (
    <div className="container py-8">
      <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="text-6xl">{coin.image}</div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">{coin.name}</h1>
              <p className="text-muted-foreground font-mono text-sm">${coin.ticker} · Created {coin.createdAt}</p>
              <p className="text-sm text-muted-foreground mt-2">{coin.description}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Creator: {coin.creator.slice(0,8)}...{coin.creator.slice(-4)}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Mock Chart */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-display text-sm font-bold mb-4">Price Chart</h3>
            <div className="h-64 flex items-end gap-0.5">
              {mockCandlestickData.map((d, i) => {
                const isGreen = d.close >= d.open;
                const bodyHeight = Math.abs(d.close - d.open) * 80000;
                const wickHeight = (d.high - d.low) * 80000;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: '100%' }}>
                    <div
                      className={`w-px ${isGreen ? 'bg-primary/40' : 'bg-destructive/40'}`}
                      style={{ height: `${Math.max(wickHeight, 2)}px` }}
                    />
                    <div
                      className={`w-full rounded-sm ${isGreen ? 'bg-primary' : 'bg-destructive'}`}
                      style={{ height: `${Math.max(bodyHeight, 2)}px`, minHeight: '2px' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Price', value: `$${coin.price.toFixed(6)}` },
              { label: 'Market Cap', value: formatNum(coin.marketCap) },
              { label: '24h Volume', value: formatNum(coin.volume24h) },
              { label: 'Holders', value: coin.holders.toLocaleString() },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-mono text-lg font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Bonding Curve */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Bonding Curve Progress</span>
              <span className="font-mono font-bold text-primary">{coin.bondingProgress}%</span>
            </div>
            <BondingCurveBar progress={coin.bondingProgress} size="lg" />
            <p className="text-xs text-muted-foreground mt-2">
              {coin.bondingProgress >= 90 ? '🎓 Almost graduated to Raydium!' : `${100 - coin.bondingProgress}% until graduation`}
            </p>
          </div>

          {/* Trades */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-display text-sm font-bold mb-3">Recent Trades</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mockTrades.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs font-mono py-1 border-b border-border/50">
                  <span className={t.type === 'buy' ? 'text-primary' : 'text-destructive'}>{t.type.toUpperCase()}</span>
                  <span className="text-muted-foreground">{t.amount} SOL</span>
                  <span className="text-foreground">${t.price}</span>
                  <span className="text-muted-foreground">{t.wallet}</span>
                  <span className="text-muted-foreground">{t.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-display text-sm font-bold mb-3">Chat 💬</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {mockChat.map(m => (
                <div key={m.id} className="text-sm">
                  <span className="font-mono text-xs text-primary">{m.wallet}</span>
                  <span className="text-muted-foreground text-xs ml-2">{m.timestamp}</span>
                  <p className="text-foreground">{m.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type something degen..."
                className="bg-muted border-border font-mono text-sm"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
              />
              <Button size="icon" className="bg-primary text-primary-foreground shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Buy/Sell Panel */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-20">
            <div className="flex gap-2 mb-4">
              {(['buy', 'sell'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-md text-sm font-display font-bold transition-colors ${
                    activeTab === tab
                      ? tab === 'buy' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (SOL)</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  className="bg-muted border-border font-mono"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {['0.1', '0.5', '1', '5'].map(v => (
                  <button
                    key={v}
                    onClick={() => setBuyAmount(v)}
                    className="flex-1 py-1 text-xs font-mono bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Slippage</label>
                <div className="flex gap-2">
                  {['0.5%', '1%', '3%', '5%'].map(s => (
                    <button
                      key={s}
                      className="flex-1 py-1 text-xs font-mono bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {buyAmount && (
                <div className="text-xs text-muted-foreground font-mono">
                  Est. output: ~{(parseFloat(buyAmount || '0') / coin.price).toLocaleString()} ${coin.ticker}
                </div>
              )}
              <Button
                className={`w-full font-display font-bold ${
                  activeTab === 'buy'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                }`}
              >
                {activeTab === 'buy' ? `Buy $${coin.ticker}` : `Sell $${coin.ticker}`}
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs border-border text-muted-foreground">
                <ExternalLink className="h-3 w-3 mr-1" /> Twitter/X
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs border-border text-muted-foreground">
                <ExternalLink className="h-3 w-3 mr-1" /> Telegram
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
