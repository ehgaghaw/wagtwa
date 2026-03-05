import { Link } from 'react-router-dom';
import rotLogo from '@/assets/rot-logo.png';

const Footer = () => (
  <footer className="border-t border-border bg-background py-6 mt-auto">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <Link to="/" className="flex items-center">
        <img src={rotLogo} alt="ROT" className="h-8 w-auto brightness-[10] contrast-[0.8]" />
      </Link>
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <Link to="#" className="hover:text-foreground transition-colors">Docs</Link>
        <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
        <Link to="#" className="hover:text-foreground transition-colors">Twitter</Link>
        <Link to="#" className="hover:text-foreground transition-colors">Discord</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
