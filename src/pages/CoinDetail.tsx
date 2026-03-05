import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, ExternalLink, Send, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BondingCurveBar from '@/components/BondingCurveBar';
import CoinAvatar from '@/components/CoinAvatar';
import { mockCoins, mockTrades, mockChat } from '@/data/mockData';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { tradeToken } from '@/services/pumpPortal';
import { useTokenTrades } from '@/hooks/useTokenTrades';
import { toast } from '@/hooks/use-toast';

const CoinDetail = () => {
  const { id } = useParams();
  const coin = mockCoins.find(c => c.id === id);
  const [buyAmount, setBuyAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [chatMsg, setChatMsg] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [selectedSlippage, setSelectedSlippage] = useState('10');
  const wallet = useWallet();
  const { connection } = useConnection();

  const liveTrades = useTokenTrades(coin?.id);

  if (!coin) return (
    <div className="container py-20 text-center text-muted-foreground">
      Coin not found. It may have already rotted away.
    </div>
  );

  const formatNum = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(1)}K` : `$${n}`;

  const handleTrade = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast({ title: 'Connect your wallet first', variant: 'destructive' });
      return;
    }
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }

    setIsTrading(true);
    try {
      const signature = await tradeToken(wallet, connection, {
        action: activeTab,
        mint: coin.id,
        amount: parseFloat(buyAmount),
        denominatedInSol: activeTab === 'buy',
        slippage: parseFloat(selectedSlippage),
      });

      toast({
        title: `${activeTab === 'buy' ? 'Buy' : 'Sell'} successful!`,
        description: (
          <a
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Solscan
          </a>
        ),
      });
      setBuyAmount('');
    } catch (err: any) {
      toast({ title: 'Trade failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsTrading(false);
    }
  };

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
            <CoinAvatar coin={coin} size={64} />
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">{coin.name}</h1>
              <p className="text-muted-foreground text-sm">${coin.ticker} · Created {coin.createdAt}</p>
              <p className="text-sm text-muted-foreground mt-2">{coin.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Creator: {coin.creator.slice(0,8)}...{coin.creator.slice(-4)}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* DexScreener Chart */}
          <div className="glass-card rounded-xl overflow-hidden">
            <h3 className="font-display text-sm font-bold p-4 pb-0">Price Chart</h3>
            <iframe
              src={`https://dexscreener.com/solana/${coin.id}?embed=1&theme=dark`}
              className="w-full h-[400px] border-0"
              title="DexScreener Chart"
              allow="clipboard-write"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Price', value: `$${coin.price.toFixed(6)}` },
              { label: 'Market Cap', value: formatNum(coin.marketCap) },
              { label: '24h Volume', value: formatNum(coin.volume24h) },
              { label: 'Holders', value: coin.holders.toLocaleString() },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Bonding Curve */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Bonding Curve Progress</span>
              <span className="font-bold text-primary">{coin.bondingProgress}%</span>
            </div>
            <BondingCurveBar progress={coin.bondingProgress} size="lg" />
            <p className="text-xs text-muted-foreground mt-2">
              {coin.bondingProgress >= 90 ? 'Almost graduated to Raydium!' : `${100 - coin.bondingProgress}% until graduation`}
            </p>
          </div>

          {/* Live Trades */}
          {liveTrades.length > 0 && (
            <div className="glass-card border-primary/20 rounded-xl p-4">
              <h3 className="font-display text-sm font-bold mb-3 text-primary flex items-center gap-2">
                <Zap className="h-4 w-4" /> Live Trades
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {liveTrades.map(t => (
                  <div key={t.signature} className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                    <span className={t.txType === 'buy' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{t.txType.toUpperCase()}</span>
                    <span className="text-muted-foreground">{t.solAmount?.toFixed(4)} SOL</span>
                    <a
                      href={`https://solscan.io/tx/${t.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t.signature.slice(0, 8)}...
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mock Trades */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display text-sm font-bold mb-3">Recent Trades</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mockTrades.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                  <span className={t.type === 'buy' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{t.type.toUpperCase()}</span>
                  <span className="text-muted-foreground">{t.amount} SOL</span>
                  <span className="text-foreground">${t.price}</span>
                  <span className="text-muted-foreground">{t.wallet}</span>
                  <span className="text-muted-foreground">{t.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display text-sm font-bold mb-3">Chat</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {mockChat.map(m => (
                <div key={m.id} className="text-sm">
                  <span className="text-xs text-primary font-medium">{m.wallet}</span>
                  <span className="text-muted-foreground text-xs ml-2">{m.timestamp}</span>
                  <p className="text-foreground">{m.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                className="bg-muted border-border text-sm"
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
          <div className="glass-card rounded-xl p-4 sticky top-20">
            <div className="flex gap-2 mb-4">
              {(['buy', 'sell'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-display font-bold transition-all duration-200 ${
                    activeTab === tab
                      ? tab === 'buy' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Amount ({activeTab === 'buy' ? 'SOL' : coin.ticker})
                </label>
                <Input
                  type="number"
                  placeholder="0.0"
                  className="bg-muted border-border"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {(activeTab === 'buy' ? ['0.1', '0.5', '1', '5'] : ['25%', '50%', '75%', '100%']).map(v => (
                  <button
                    key={v}
                    onClick={() => setBuyAmount(v.replace('%', ''))}
                    className="flex-1 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors font-medium"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Slippage</label>
                <div className="flex gap-2">
                  {['1', '5', '10', '20'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSlippage(s)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-all duration-200 font-medium ${
                        selectedSlippage === s
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-muted hover:bg-muted/80 border-border'
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
              {buyAmount && activeTab === 'buy' && (
                <div className="text-xs text-muted-foreground">
                  Est. output: ~{(parseFloat(buyAmount || '0') / coin.price).toLocaleString()} ${coin.ticker}
                </div>
              )}

              {!wallet.connected && (
                <p className="text-xs text-destructive text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Connect wallet to trade
                </p>
              )}

              <Button
                onClick={handleTrade}
                disabled={isTrading || !wallet.connected || !buyAmount}
                className={`w-full font-display font-bold rounded-xl ${
                  activeTab === 'buy'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                } disabled:opacity-50`}
              >
                {isTrading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  activeTab === 'buy' ? `Buy $${coin.ticker}` : `Sell $${coin.ticker}`
                )}
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs border-border text-muted-foreground rounded-lg">
                <ExternalLink className="h-3 w-3 mr-1" /> Twitter/X
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs border-border text-muted-foreground rounded-lg">
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
