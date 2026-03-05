import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Flame, Clock, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoinCard from '@/components/CoinCard';
import { mockCoins } from '@/data/mockData';
import rotLogoAnim from '@/assets/rot-logo-anim.mp4';
import { useEffect, useRef } from 'react';

const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 2 + Math.random() * 4,
    color: Math.random() > 0.5 ? 'hsl(135 100% 50%)' : 'hsl(263 70% 50%)',
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float-up"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.6,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            filter: `blur(${p.size > 4 ? 1 : 0}px)`,
          }}
        />
      ))}
    </div>
  );
};

const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );
    const el = ref.current;
    if (el) {
      el.querySelectorAll('.scroll-reveal').forEach((child) => observer.observe(child));
    }
    return () => observer.disconnect();
  }, []);
  return ref;
};

const Index = () => {
  const trending = [...mockCoins].sort((a, b) => b.volume24h - a.volume24h).slice(0, 4);
  const newCoins = [...mockCoins].sort(() => Math.random() - 0.5).slice(0, 4);
  const graduating = [...mockCoins].sort((a, b) => b.bondingProgress - a.bondingProgress).slice(0, 4);
  const pageRef = useScrollReveal();

  return (
    <div ref={pageRef}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border min-h-screen flex items-center justify-center hero-grid" style={{ backgroundColor: '#000000' }}>
        <Particles />
        <div className="relative container py-24 md:py-32 text-center z-10">
          <motion.div
            className="relative inline-block mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <video
              src={rotLogoAnim}
              autoPlay
              loop
              muted
              playsInline
              className="w-[320px] md:w-[500px] lg:w-[600px] h-auto mx-auto"
              style={{ mixBlendMode: 'lighten' }}
            />
          </motion.div>
          <motion.p
            className="text-lg md:text-2xl text-muted-foreground font-glitch mb-10 max-w-2xl mx-auto animate-flicker tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Launch Your Brainrot. Pump It. Let It Rot. 🧠🪱
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-5 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/launch">
              <Button size="lg" className="relative bg-primary text-primary-foreground font-display font-bold text-base px-10 py-6 hover:bg-primary/90 animate-pulse-glow gradient-border rounded-lg">
                <Rocket className="mr-2 h-5 w-5" /> Launch a Coin
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 font-display font-bold text-base px-10 py-6 hover:box-glow-purple transition-all duration-300">
                Explore Coins
              </Button>
            </Link>
          </motion.div>
        </div>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* Trending */}
      <section className="relative py-16" style={{ background: 'linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(0 0% 6%) 50%, hsl(0 0% 4%) 100%)' }}>
        <div className="container scroll-reveal">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-destructive" />
              <h2 className="font-display text-2xl font-bold text-glow-green">Trending</h2>
            </div>
            <Link to="/explore" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map((coin) => <CoinCard key={coin.id} coin={coin} />)}
          </div>
        </div>
      </section>

      {/* New Launches */}
      <section className="relative py-16 border-t border-border">
        <div className="container scroll-reveal">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-secondary" />
              <h2 className="font-display text-2xl font-bold text-glow-purple">New Launches</h2>
            </div>
            <Link to="/explore" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newCoins.map((coin) => <CoinCard key={coin.id} coin={coin} />)}
          </div>
        </div>
      </section>

      {/* About to Graduate */}
      <section className="relative py-16 border-t border-border">
        <div className="container scroll-reveal">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-glow-green">About to Graduate 🎓</h2>
            </div>
            <Link to="/explore" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {graduating.map((coin) => (
              <CoinCard key={coin.id} coin={coin} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
