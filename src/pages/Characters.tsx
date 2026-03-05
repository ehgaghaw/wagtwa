import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Rocket, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brainrotCharacters, type BrainrotUniverse } from '@/data/mockData';
import { Link } from 'react-router-dom';
import UniverseFilter from '@/components/UniverseFilter';

const tagColors: Record<string, string> = {
  cursed: 'bg-destructive/20 text-destructive',
  'wholesome rot': 'bg-primary/20 text-primary',
  sigma: 'bg-secondary/20 text-secondary-foreground',
  NPC: 'bg-muted text-muted-foreground',
  cooked: 'bg-orange-500/20 text-orange-400',
};

const Characters = () => {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [universe, setUniverse] = useState<BrainrotUniverse>('All');

  const filtered = brainrotCharacters.filter(c => universe === 'All' || c.universe === universe);

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Characters</h1>
          <p className="text-muted-foreground text-xs">The pantheon of brainrot</p>
        </div>
        <Link to="/create-character">
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Create
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Brainrot Universes</p>
        <UniverseFilter selected={universe} onChange={setUniverse} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(char => (
          <div
            key={char.id}
            className="bg-card border border-border rounded-md p-4 hover:border-muted-foreground/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-foreground text-sm shrink-0 border border-border"
                style={{ background: char.avatarGradient }}
              >
                {char.avatarLetter}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{char.name}</h3>
                <span className="text-xs text-muted-foreground">{char.universe}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{char.lore}</p>
            <div className="flex gap-1 flex-wrap mb-3">
              {char.tags.map(t => (
                <span key={t} className={`px-2 py-0.5 rounded text-xs font-medium ${tagColors[t] || 'bg-muted text-muted-foreground'}`}>
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
                  <ThumbsUp className="h-3 w-3" />
                </button>
                <span className="text-xs font-semibold font-mono-num text-foreground">{char.votes + (votes[char.id] || 0)}</span>
                <button className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                  <ThumbsDown className="h-3 w-3" />
                </button>
              </div>
              {char.hasCoin ? (
                <Link to={`/coin/${char.coinId}`}>
                  <span className="text-xs text-primary font-medium">View Coin</span>
                </Link>
              ) : (
                <Link to="/launch">
                  <Button size="sm" variant="outline" className="text-xs border-primary text-primary hover:bg-primary/10 h-7">
                    <Rocket className="h-3 w-3 mr-1" /> Launch
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No characters in this universe yet.
        </div>
      )}
    </div>
  );
};

export default Characters;
