import { motion } from 'framer-motion';

interface BondingCurveBarProps {
  progress: number;
  size?: 'sm' | 'lg';
}

const BondingCurveBar = ({ progress, size = 'sm' }: BondingCurveBarProps) => (
  <div className={`w-full rounded-full bg-muted overflow-hidden ${size === 'lg' ? 'h-5' : 'h-3'}`}>
    <motion.div
      className="h-full rounded-full bonding-gradient relative"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(progress, 100)}%` }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        boxShadow: progress > 80
          ? '0 0 16px hsl(0 84% 60% / 0.6), inset 0 0 8px hsl(0 84% 60% / 0.3)'
          : progress > 50
          ? '0 0 16px hsl(60 100% 50% / 0.4), inset 0 0 8px hsl(60 100% 50% / 0.2)'
          : '0 0 16px hsl(135 100% 50% / 0.4), inset 0 0 8px hsl(135 100% 50% / 0.2)',
      }}
    />
  </div>
);

export default BondingCurveBar;
