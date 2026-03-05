import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border py-12 mt-auto" style={{ background: 'linear-gradient(180deg, hsl(0 0% 4%), hsl(0 0% 2%))' }}>
    <div className="container">
      <p className="font-glitch text-2xl md:text-3xl text-center text-muted-foreground mb-8 animate-flicker tracking-wide">
        Your brain is already rotting. Might as well profit from it. 🧠🪱
      </p>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="#" className="hover:text-primary transition-all duration-300 hover:text-glow-green">About</Link>
          <Link to="#" className="hover:text-primary transition-all duration-300 hover:text-glow-green">Docs</Link>
          <Link to="#" className="hover:text-primary transition-all duration-300 hover:text-glow-green">Terms</Link>
          <Link to="#" className="hover:text-primary transition-all duration-300 hover:text-glow-green">Twitter/X</Link>
          <Link to="#" className="hover:text-primary transition-all duration-300 hover:text-glow-green">Telegram</Link>
          <Link to="#" className="hover:text-primary transition-all duration-300 hover:text-glow-green">Discord</Link>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          © ROT Protocol {new Date().getFullYear()}
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
