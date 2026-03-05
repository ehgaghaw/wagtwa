import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Flame, Clock, GraduationCap, Zap, Users, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoinCard from '@/components/CoinCard';
import { mockCoins } from '@/data/mockData';
import rotLogoAnim from '@/assets/rot-logo-anim.mp4';

const stats = [
  { label: 'Coins Launched', value: '2.4K+', icon: Rocket },
  { label: 'Active Traders', value: '12K+', icon: Users },
  { label: 'Total Volume', value: '$8.2M+', icon: BarChart3 },
];

const features = [
  { icon: Rocket, title: 'Launch Coins', desc: 'Create your brainrot token in seconds with built-in bonding curves' },
  { icon: Zap, title: 'AI Characters', desc: 'Generate viral AI characters to power your meme coin narrative' },
  { icon: BarChart3, title: 'Trade & Track', desc: 'Real-time charts, portfolio tracking, and instant swaps' },
];

const Index = () => {
  const trending = [...mockCoins].sort((a, b) => b.volume24h - a.volume24h).slice(0, 4);
  const newCoins = [...mockCoins].sort(() => Math.random() - 0.5).slice(0, 4);
  const graduating = [...mockCoins].sort((a, b) => b.bondingProgress - a.bondingProgress).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="relative container py-20 md:py-32 text-center">
          <motion.div
            className="relative inline-block mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <video
              src={rotLogoAnim}
              autoPlay
              loop
              muted
              playsInline
              className="h-32 md:h-44 lg:h-52 w-auto mx-auto"
              style={{ mixBlendMode: 'screen' }}
            />
          </motion.div>
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            The Ultimate{' '}
            <span className="text-gradient-pink">Brainrot</span>
            {' '}Launchpad
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Launch your brainrot coin, generate AI characters, and ride the bonding curve to glory.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/launch">
              <Button size="lg" className="gradient-btn text-primary-foreground font-display font-bold text-base px-8 h-12 rounded-xl border-0">
                <Rocket className="mr-2 h-5 w-5" /> Start Creating
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted/50 font-display font-bold text-base px-8 h-12 rounded-xl">
                Explore Coins <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-muted/20">
        <div className="container py-8">
          <div className="grid grid-cols-3 gap-6">
            {stats.map(({ label, value, icon: Icon }, i) => (
              <motion.div
                key={label}
                className="stat-card rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.7 }}
              >
                <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-display font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-gradient">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Master the <span className="text-gradient-pink">Multi-Verse</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Professional-grade tools designed for the next generation of degen content creators.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                className="glass-card rounded-xl p-6 text-center transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Flame className="h-4 w-4 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Trending Now</h2>
          </div>
          <Link to="/explore" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trending.map((coin, i) => (
            <motion.div
              key={coin.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
            >
              <CoinCard coin={coin} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* New Launches */}
      <section className="border-t border-border">
        <div className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-secondary" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">New Launches</h2>
            </div>
            <Link to="/explore" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newCoins.map((coin, i) => (
              <motion.div
                key={coin.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
              >
                <CoinCard coin={coin} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About to Graduate */}
      <section className="border-t border-border">
        <div className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">About to Graduate</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {graduating.map((coin, i) => (
              <motion.div
                key={coin.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
              >
                <CoinCard coin={coin} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border section-gradient">
        <div className="container py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Ready to <span className="text-gradient-pink">Go Viral</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of degens building massive meme empires with brainrot-powered tokens.
            </p>
            <Link to="/launch">
              <Button size="lg" className="gradient-btn text-primary-foreground font-display font-bold text-base px-10 h-12 rounded-xl border-0">
                Start Creating Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
