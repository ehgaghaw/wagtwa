import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Rocket, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brainrotCharacters } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const tagColors: Record<string, string> = {
  cursed: 'bg-destructive/20 text-destructive',
  'wholesome rot': 'bg-primary/20 text-primary',
  sigma: 'bg-secondary/20 text-secondary',
  NPC: 'bg-muted text-muted-foreground',
  cooked: 'bg-orange-500/20 text-orange-400',
};

const Characters = () => {
  const [votes, setVotes] = useState<Record<string, number>>({});

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Brainrot Characters</h1>
          <p className="text-muted-foreground text-sm font-mono">The pantheon of degeneracy</p>
        </div>
        <Link to="/create-character">
          <Button className="bg-secondary text-secondary-foreground font-display font-bold hover:bg-secondary/90">
            <Plus className="h-4 w-4 mr-2" /> Create Character
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brainrotCharacters.map((char, i) => (
          <motion.div
            key={char.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-lg p-5 card-hover"
          >
            <div className="text-5xl mb-3">{char.image}</div>
            <h3 className="font-display text-lg font-bold mb-1">{char.name}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{char.lore}</p>
            <div className="flex gap-1 flex-wrap mb-4">
              {char.tags.map(t => (
                <span key={t} className={`px-2 py-0.5 rounded text-xs font-mono ${tagColors[t] || 'bg-muted text-muted-foreground'}`}>
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVotes(v => ({ ...v, [char.id]: (v[char.id] || 0) + 1 }))}
                  className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-sm text-foreground">{char.votes + (votes[char.id] || 0)}</span>
                <button className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
              {char.hasCoin ? (
                <Link to={`/coin/${char.coinId}`}>
                  <span className="text-xs font-mono text-primary">View Coin →</span>
                </Link>
              ) : (
                <Link to="/launch">
                  <Button size="sm" variant="outline" className="text-xs border-primary text-primary hover:bg-primary/10">
                    <Rocket className="h-3 w-3 mr-1" /> Launch Coin
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Characters;
