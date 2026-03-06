import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
// Button removed — unused
import CoinCard from '@/components/CoinCard';
import { BrainrotCoin } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';


const Index = () => {
  const [coins, setCoins] = useState<BrainrotCoin[]>([]);

  useEffect(() => {
    const fetchCoins = async () => {
      const { data, error } = await supabase.functions.invoke('character-vote', {
        body: { action: 'coins' },
      });

      if (error || !data) return;
      const rows = (data as any).coins || [];

      setCoins(rows.map((c: any) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        description: c.description || '',
        image: c.image_url || '',
        avatarGradient: 'linear-gradient(135deg, hsl(280 80% 55%), hsl(330 85% 60%))',
        avatarLetter: c.name.charAt(0).toUpperCase(),
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        bondingProgress: 0,
        creator: c.creator_display || 'anonymous',
        createdAt: new Date(c.created_at).toLocaleDateString(),
        holders: 0,
        tags: [],
        universe: c.universe as any,
      })));
    };

    fetchCoins();

    const poll = window.setInterval(() => {
      fetchCoins();
    }, 8000);

    return () => {
      window.clearInterval(poll);
    };
  }, []);

  return (
    <div>
      {/* Hero — compact, no fluff */}
      <section className="container py-12 md:py-16 text-center">
        <div className="h-24 md:h-32 w-auto mx-auto mb-6 flex items-center justify-center">
          <span className="text-5xl md:text-7xl font-black tracking-tight text-primary">ROT</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-3 glitch-rainbow">
          The Brainrot Launchpad
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
          Launch Your Brainrot. Let it Rot.
        </p>
        <div className="flex gap-4 justify-center items-center">
          <Link to="/launch">
            <motion.span
              className="text-sm font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Launch a Brainrot Character ✦
            </motion.span>
          </Link>
          <Link to="/explore">
            <motion.span
              className="text-sm font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Explore <ArrowRight className="h-3.5 w-3.5" />
            </motion.span>
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
          {coins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No coins launched yet. Be the first!</p>
              <Link to="/launch" className="text-primary hover:text-primary/80 text-sm font-semibold mt-4 inline-block">
                Launch a Brainrot Character →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {coins.map(coin => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
