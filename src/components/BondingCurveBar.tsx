import { motion } from 'framer-motion';

interface BondingCurveBarProps {
  progress: number;
  size?: 'sm' | 'lg';
}

const BondingCurveBar = ({ progress, size = 'sm' }: BondingCurveBarProps) => (
  <div className={`w-full rounded-full bg-muted overflow-hidden ${size === 'lg' ? 'h-3' : 'h-2'}`}>
    <motion.div
      className="h-full rounded-full relative"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(progress, 100)}%` }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        background: 'linear-gradient(90deg, hsl(330 85% 60%), hsl(270 70% 55%))',
        boxShadow: progress > 70
          ? '0 0 10px hsl(330 85% 60% / 0.5)'
          : '0 0 6px hsl(270 70% 55% / 0.3)',
      }}
    />
  </div>
);

export default BondingCurveBar;
