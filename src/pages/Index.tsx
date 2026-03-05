import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Flame, Clock, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoinCard from '@/components/CoinCard';
import { mockCoins } from '@/data/mockData';
import heroBg from '@/assets/hero-bg.jpg';
import rotLogo from '@/assets/rot-logo.png';

const Index = () => {
  const trending = [...mockCoins].sort((a, b) => b.volume24h - a.volume24h).slice(0, 4);
  const newCoins = [...mockCoins].sort(() => Math.random() - 0.5).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        <div className="relative container py-24 md:py-32 text-center">
          <motion.div
            className="relative inline-block mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.img
              src={rotLogo}
              alt="ROT"
              className="h-40 md:h-56 lg:h-64 w-auto mx-auto drop-shadow-[0_0_40px_hsl(120,100%,50%,0.3)]"
              animate={{
                filter: [
                  'drop-shadow(0 0 20px hsl(120,100%,50%,0.3))',
                  'drop-shadow(0 0 40px hsl(120,100%,50%,0.5))',
                  'drop-shadow(0 0 20px hsl(120,100%,50%,0.3))',
                ],
                y: [0, 3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Melting drip elements */}
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute bottom-0 rounded-full bg-gradient-to-b from-foreground/20 to-transparent"
                style={{
                  left: `${15 + i * 18}%`,
                  width: `${4 + (i % 3) * 2}px`,
                }}
                animate={{
                  height: ['0px', `${16 + (i % 3) * 12}px`, '0px'],
                  opacity: [0, 0.6, 0],
                  y: [0, 12 + i * 4, 24 + i * 4],
                }}
                transition={{
                  duration: 2.5 + i * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.6,
                }}
              />
            ))}
          </motion.div>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground font-mono mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Launch Your Brainrot. Pump It. Let It Rot. 🧠🪱
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/launch">
              <Button size="lg" className="bg-primary text-primary-foreground font-display font-bold text-base px-8 hover:bg-primary/90 box-glow-green">
                <Rocket className="mr-2 h-5 w-5" /> Launch a Coin
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 font-display font-bold text-base px-8">
                Explore Coins
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trending */}
      <section className="container py-12">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-xl font-bold">Trending</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trending.map((coin) => <CoinCard key={coin.id} coin={coin} />)}
        </div>
      </section>

      {/* New Launches */}
      <section className="container py-12 border-t border-border">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-secondary" />
          <h2 className="font-display text-xl font-bold">New Launches</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newCoins.map((coin) => <CoinCard key={coin.id} coin={coin} />)}
        </div>
      </section>

      {/* About to Graduate */}
      <section className="container py-12 border-t border-border">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">About to Graduate 🎓</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...mockCoins].sort((a, b) => b.bondingProgress - a.bondingProgress).slice(0, 4).map((coin) => (
            <CoinCard key={coin.id} coin={coin} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
