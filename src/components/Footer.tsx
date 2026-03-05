import { Link } from 'react-router-dom';
import rotLogo from '@/assets/rot-logo.png';

const Footer = () => (
  <footer className="border-t border-border bg-background py-12 mt-auto">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2.5">
          <img src={rotLogo} alt="ROT" className="h-7 w-auto opacity-60" />
          <span className="font-display font-bold text-foreground/60">ROT</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="#" className="hover:text-foreground transition-colors">About</Link>
          <Link to="#" className="hover:text-foreground transition-colors">Docs</Link>
          <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="#" className="hover:text-foreground transition-colors">Twitter/X</Link>
          <Link to="#" className="hover:text-foreground transition-colors">Discord</Link>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Your brain is already rotting. Might as well profit from it. 🧠🪱
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
