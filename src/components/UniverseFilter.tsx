import { useRef } from 'react';
import { BRAINROT_UNIVERSES, type BrainrotUniverse } from '@/data/mockData';

interface UniverseFilterProps {
  selected: BrainrotUniverse;
  onChange: (universe: BrainrotUniverse) => void;
}

const UniverseFilter = ({ selected, onChange }: UniverseFilterProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {BRAINROT_UNIVERSES.map(u => (
        <button
          key={u}
          onClick={() => onChange(u)}
          className={`shrink-0 px-5 py-3 rounded text-xs font-medium transition-all duration-150 border ${
            selected === u
              ? 'bg-card border-primary text-foreground'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
          }`}
          style={{ minWidth: '120px' }}
        >
          {u}
        </button>
      ))}
    </div>
  );
};

export default UniverseFilter;
