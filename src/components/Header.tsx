import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold text-lg text-foreground tracking-tight">
            ROT
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-1.5 text-xs font-medium transition-colors rounded ${
                  location.pathname === path
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !font-semibold !rounded !h-8 !px-3" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border">
              <SheetTitle className="text-foreground">Navigation</SheetTitle>
              <nav className="flex flex-col gap-1 mt-4">
                {navLinks.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                      location.pathname === path
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
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
