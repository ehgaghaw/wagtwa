import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border bg-background py-8 mt-auto">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="#" className="hover:text-primary transition-colors">About</Link>
          <Link to="#" className="hover:text-primary transition-colors">Docs</Link>
          <Link to="#" className="hover:text-primary transition-colors">Terms</Link>
          <Link to="#" className="hover:text-primary transition-colors">Twitter/X</Link>
          <Link to="#" className="hover:text-primary transition-colors">Telegram</Link>
          <Link to="#" className="hover:text-primary transition-colors">Discord</Link>
        </div>
        <p className="text-xs text-muted-foreground font-mono italic">
          Your brain is already rotting. Might as well profit from it. 🧠🪱
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
