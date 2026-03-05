import { Link } from 'react-router-dom';
import rotLogo from '@/assets/rot-logo.png';

const Footer = () => (
  <footer className="border-t border-border bg-background py-8 mt-auto">
    <div className="container flex items-center justify-center">
      <Link to="/" className="flex items-center">
        <img src={rotLogo} alt="ROT" className="h-14 w-auto brightness-[10] contrast-[0.8]" />
      </Link>
    </div>
  </footer>
);

export default Footer;
