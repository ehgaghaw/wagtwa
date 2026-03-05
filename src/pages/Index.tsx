import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoinCard from '@/components/CoinCard';
import { mockCoins } from '@/data/mockData';
import rotLogoAnim from '@/assets/rot-logo-anim.webm';

const Index = () => {
  const trending = [...mockCoins].sort((a, b) => b.volume24h - a.volume24h);

  return (
    <div>
      {/* Hero — compact, no fluff */}
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
          Launch meme coins. Trade the bonding curve. Go viral.
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

      {/* Coin Grid — immediately after hero */}
      <section className="border-t border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Trending Coins</h2>
            <Link to="/explore" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {trending.map(coin => (
              <CoinCard key={coin.id} coin={coin} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
