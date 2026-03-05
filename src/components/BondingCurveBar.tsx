import { motion } from 'framer-motion';

interface BondingCurveBarProps {
  progress: number;
  size?: 'sm' | 'lg';
}

const BondingCurveBar = ({ progress, size = 'sm' }: BondingCurveBarProps) => (
  <div className={`w-full rounded-full bg-muted overflow-hidden ${size === 'lg' ? 'h-4' : 'h-2'}`}>
    <motion.div
      className="h-full rounded-full bonding-gradient relative"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(progress, 100)}%` }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        boxShadow: progress > 80
          ? '0 0 12px hsl(0 90% 55% / 0.6)'
          : progress > 50
          ? '0 0 12px hsl(60 100% 50% / 0.4)'
          : '0 0 12px hsl(120 100% 50% / 0.4)',
      }}
    />
  </div>
);

export default BondingCurveBar;
