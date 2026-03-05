import { Wallet, TrendingUp, TrendingDown, Coins, RefreshCw, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWalletPortfolio } from '@/hooks/useWalletPortfolio';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const shortenMint = (mint: string) => `${mint.slice(0, 4)}...${mint.slice(-4)}`;
const shortenAddr = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

const Portfolio = () => {
  const { connected, address, solBalance, tokens, loading, error, refresh } = useWalletPortfolio();

  if (!connected) {
    return (
      <div className="container py-16 text-center">
        <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Connect Your Wallet</h1>
        <p className="text-sm text-muted-foreground mb-6">Connect your Solana wallet to view your portfolio</p>
        <WalletMultiButton className="!bg-primary !text-primary-foreground !text-sm !font-semibold !rounded !h-9 !px-5 !mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl">
      {/* Wallet Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Portfolio</h1>
          <p className="text-xs text-muted-foreground font-mono-num">{address ? shortenAddr(address) : ''}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-border text-muted-foreground h-7 text-xs"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 mb-5 flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3 shrink-0" /> {error}
        </div>
      )}

      {/* SOL Balance Card */}
      <div className="bg-card border border-border rounded-md p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-foreground text-sm">
            S
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SOL Balance</p>
            <p className="text-2xl font-bold font-mono-num text-foreground">{solBalance.toFixed(4)} SOL</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-md p-3">
            <p className="text-xs text-muted-foreground">Tokens Held</p>
            <p className="text-lg font-bold font-mono-num">{tokens.length}</p>
          </div>
          <div className="bg-muted rounded-md p-3">
            <p className="text-xs text-muted-foreground">Wallet</p>
            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
            >
              View on Solscan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Token Holdings</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-card border border-border rounded-md p-8 text-center">
            <p className="text-sm text-muted-foreground">No SPL tokens found in this wallet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map(token => (
              <a
                key={token.mint}
                href={`https://solscan.io/token/${token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-card border border-border rounded-md p-4 hover:border-muted-foreground/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-foreground text-xs border border-border shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hashToHue(token.mint)} 60% 45%), hsl(${hashToHue(token.mint) + 40} 50% 55%))`,
                    }}
                  >
                    {token.mint.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono-num text-muted-foreground truncate">{shortenMint(token.mint)}</p>
                    <p className="text-sm font-semibold font-mono-num text-foreground">
                      {token.uiAmount < 0.001
                        ? token.uiAmount.toExponential(2)
                        : token.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple hash to generate a consistent hue from a mint address
function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export default Portfolio;
