import { useState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const tags = ['cursed', 'wholesome rot', 'sigma', 'NPC', 'cooked'];
const heads = ['🤡', '💀', '👽', '🤖', '🐸', '😈', '🗿', '👾'];
const accessories = ['🎩', '🕶️', '👑', '🎭', '🧢', '💎', '🔥', '⭐'];

const CreateCharacter = () => {
  const [name, setName] = useState('');
  const [lore, setLore] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [mode, setMode] = useState<'upload' | 'builder'>('builder');

  const toggleTag = (t: string) => setSelectedTags(st => st.includes(t) ? st.filter(x => x !== t) : [...st, t]);

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2">Create a Character</h1>
      <p className="text-muted-foreground text-sm mb-8 font-mono">Bring your brainrot vision to life</p>

      <div className="flex gap-2 mb-6">
        {(['builder', 'upload'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-md text-sm font-mono transition-colors ${
              mode === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {m === 'builder' ? '🎨 Character Builder' : '📁 Upload Art'}
          </button>
        ))}
      </div>

      {mode === 'builder' ? (
        <div className="space-y-6">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Head / Base</label>
            <div className="flex gap-2 flex-wrap">
              {heads.map(h => (
                <button
                  key={h}
                  onClick={() => setSelectedHead(h)}
                  className={`text-3xl p-3 rounded-lg border transition-all ${
                    selectedHead === h ? 'border-primary bg-primary/10 box-glow-green' : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Accessory</label>
            <div className="flex gap-2 flex-wrap">
              {accessories.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedAccessory(a)}
                  className={`text-3xl p-3 rounded-lg border transition-all ${
                    selectedAccessory === a ? 'border-secondary bg-secondary/10 box-glow-purple' : 'border-border bg-card hover:border-secondary/30'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          {(selectedHead || selectedAccessory) && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="text-6xl">
                {selectedHead}{selectedAccessory}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-mono">Click or drag to upload character art</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}

      <div className="space-y-4 mt-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Character Name</label>
          <Input className="bg-muted border-border font-mono" placeholder="e.g. Spaghettino Cuchilino" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Lore / Backstory</label>
          <Textarea className="bg-muted border-border font-mono" placeholder="What is this creature's deal?" value={lore} onChange={e => setLore(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Tags</label>
          <div className="flex gap-2 flex-wrap">
            {tags.map(t => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                  selectedTags.includes(t) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full bg-secondary text-secondary-foreground font-display font-bold hover:bg-secondary/90 box-glow-purple">
          <Sparkles className="h-4 w-4 mr-2" /> Submit to Gallery
        </Button>
      </div>
    </div>
  );
};

export default CreateCharacter;
