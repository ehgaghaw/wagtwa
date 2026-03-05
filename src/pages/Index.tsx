import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import rotLogoAnim from '@/assets/rot-logo-anim.webm';
import { useNewTokens } from '@/hooks/useNewTokens';

const Index = () => {
  const newTokens = useNewTokens(8);

  return (
    <div>
      {/* Hero */}
      <section className="container py-12 md:py-16 text-center">
        <video
          src={rotLogoAnim}
          autoPlay
          loop
          muted
          playsInline
          className="h-24 md:h-32 w-auto mx-auto mb-6"
        />
        <h1 className="text-3xl md:text-5xl font-bold mb-3 text-foreground">
          The Brainrot Launchpad
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
          Launch brainrot characters as memecoins on Solana
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/launch">
            <Button size="lg" className="bg-primary text-primary-foreground font-semibold text-sm px-6 h-10 rounded-md border-0 hover:bg-primary/90">
              <Rocket className="mr-2 h-4 w-4" /> Launch a Coin
            </Button>
          </Link>
          <Link to="/explore">
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted font-semibold text-sm px-6 h-10 rounded-md">
              Explore <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Recently Launched — live from PumpPortal */}
      <section className="border-t border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recently Launched</h2>
            <Link to="/explore" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {newTokens.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {newTokens.map(token => (
                <a
                  key={token.mint}
                  href={`https://pump.fun/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border border-border rounded-md p-4 hover:border-muted-foreground/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm border border-border">
                      {token.symbol?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold truncate">{token.name}</h3>
                      <span className="text-xs text-primary font-mono">${token.symbol}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-mono">{token.mint}</p>
                  {token.marketCapSol > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      MCap: {token.marketCapSol.toFixed(2)} SOL
                    </p>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground text-sm">Connecting to live feed...</p>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
