import { Link, useLocation } from 'react-router-dom';
import { Bell, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/explore', label: 'Explore' },
  { path: '/launch', label: 'Launch' },
  { path: '/characters', label: 'Characters' },
  { path: '/portfolio', label: 'Portfolio' },
];

const Header = () => {
  const location = useLocation();
  const [walletConnected, setWalletConnected] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <motion.span
              className="font-display text-2xl font-black text-primary text-glow-green tracking-widest"
              whileHover={{ scale: 1.05 }}
              style={{ fontStyle: 'italic' }}
            >
              R<span className="text-destructive text-glow-red">O</span>T
            </motion.span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 text-sm font-mono transition-colors rounded-md ${
                  location.pathname === path
                    ? 'text-primary text-glow-green bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setWalletConnected(!walletConnected)}
            className={walletConnected
              ? 'bg-muted text-primary border border-primary/30 hover:bg-muted/80 font-mono text-xs'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs font-bold'
            }
          >
            <Wallet className="h-4 w-4 mr-2" />
            {walletConnected ? 'DgN4...x9Rq' : 'Connect Wallet'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
