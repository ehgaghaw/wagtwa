import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/60 backdrop-blur-2xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.img
              src={rotLogo}
              alt="ROT"
              className="h-8 w-auto"
              whileHover={{ scale: 1.05 }}
            />
            <span className="font-display font-bold text-lg text-foreground">ROT</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3.5 py-2 text-sm font-medium transition-colors rounded-lg ${
                  location.pathname === path
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !font-semibold !rounded-lg !h-9 !px-4" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border">
              <SheetTitle className="text-foreground font-display">Navigation</SheetTitle>
              <nav className="flex flex-col gap-2 mt-6">
                {navLinks.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === path
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
