import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Rocket, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAINROT_UNIVERSES, type BrainrotUniverse, type BrainrotCharacter } from '@/data/mockData';
import { Link, useNavigate } from 'react-router-dom';
import UniverseFilter from '@/components/UniverseFilter';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from '@/hooks/use-toast';

const tagColors: Record<string, string> = {
  cursed: 'bg-destructive/20 text-destructive',
  'wholesome rot': 'bg-primary/20 text-primary',
  sigma: 'bg-secondary/20 text-secondary-foreground',
  NPC: 'bg-muted text-muted-foreground',
  cooked: 'bg-orange-500/20 text-orange-400',
};

interface VoteCounts {
  [characterId: string]: { up: number; down: number };
}

interface UserVotes {
  [characterId: string]: 'up' | 'down';
}

const Characters = () => {
  const [universe, setUniverse] = useState<BrainrotUniverse>('All');
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [characters, setCharacters] = useState<BrainrotCharacter[]>([]);
  const navigate = useNavigate();
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() || null;

  const fetchCharacters = useCallback(async () => {
    const { data } = await supabase.from('characters').select('*');
    if (!data) return;
    const mapped: BrainrotCharacter[] = data.map((c) => ({
      id: c.id,
      name: c.name,
      lore: c.lore || '',
      image: c.image_url,
      avatarGradient: 'linear-gradient(135deg, hsl(280 80% 55%), hsl(330 85% 60%))',
      avatarLetter: c.name.charAt(0).toUpperCase(),
      tags: c.tags || [],
      votes: c.upvotes - c.downvotes,
      hasCoin: false,
      universe: (c as any).universe as BrainrotUniverse || 'Italian Brainrot',
    }));
    setCharacters(mapped);
  }, []);

  const fetchVotes = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('character-vote', {
      body: { action: 'summary', walletAddress },
    });

    if (error || !data) return;
    setVoteCounts((data as any).voteCounts || {});
    setUserVotes((data as any).userVotes || {});
  }, [walletAddress]);

  useEffect(() => {
    fetchVotes();
    fetchCharacters();

    const charChannel = supabase
      .channel('characters-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => {
        fetchCharacters();
      })
      .subscribe();

    const votePoll = window.setInterval(() => {
      fetchVotes();
    }, 8000);

    return () => {
      window.clearInterval(votePoll);
      supabase.removeChannel(charChannel);
    };
  }, [fetchVotes, fetchCharacters]);

  const handleVote = async (characterId: string, voteType: 'up' | 'down') => {
    if (!walletAddress) {
      toast({ title: 'Connect your wallet to vote', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.functions.invoke('character-vote', {
      body: { action: 'vote', characterId, voteType, walletAddress },
    });

    if (error) {
      toast({ title: 'Vote failed', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchVotes();
  };

  const filtered = characters.filter(c => universe === 'All' || c.universe === universe);

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Characters</h1>
          <p className="text-muted-foreground text-xs">The roster of rot</p>
        </div>
        <Link to="/create-character">
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Create <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Brainrot Universes</p>
        <UniverseFilter selected={universe} onChange={setUniverse} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(char => {
          const counts = voteCounts[char.id] || { up: 0, down: 0 };
          const myVote = userVotes[char.id];
          return (
            <div
              key={char.id}
              className="bg-card border border-border rounded-md p-4 hover:border-muted-foreground/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                {char.image ? (
                  <img
                    src={char.image}
                    alt={char.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-foreground text-sm shrink-0 border border-border"
                    style={{ background: char.avatarGradient }}
                  >
                    {char.avatarLetter}
                  </div>
                )}
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
                    onClick={() => handleVote(char.id, 'up')}
                    className={`p-1.5 rounded transition-colors ${myVote === 'up' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-primary'}`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-semibold font-mono-num text-foreground">{counts.up}</span>
                  <button
                    onClick={() => handleVote(char.id, 'down')}
                    className={`p-1.5 rounded transition-colors ${myVote === 'down' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground hover:text-destructive'}`}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-semibold font-mono-num text-foreground">{counts.down}</span>
                </div>
                {char.hasCoin ? (
                  <Link to={`/coin/${char.coinId}`}>
                    <span className="text-xs text-primary font-medium">View Coin</span>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-primary text-primary hover:bg-primary/10 h-7"
                    onClick={() => navigate('/launch', { state: { prefill: { name: char.name, lore: char.lore, imageUrl: char.image, universe: char.universe } } })}
                  >
                    <Rocket className="h-3 w-3 mr-1" /> Launch
                  </Button>
                )}
              </div>
            </div>
          );
        })}
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
