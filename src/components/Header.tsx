import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import rotLogo from '@/assets/rot-logo.png';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/explore', label: 'Explore' },
  { path: '/launch', label: 'Launch' },
  { path: '/characters', label: 'Characters' },
  { path: '/portfolio', label: 'Portfolio' },
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              src={rotLogo}
              alt="ROT"
              className="h-10 w-auto drop-shadow-[0_0_12px_hsl(120,100%,50%,0.4)]"
              whileHover={{ scale: 1.08 }}
            />
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
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-mono !text-xs !font-bold !rounded-md !h-9 !px-4" />
        </div>
      </div>
    </header>
  );
};

export default Header;
