import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Brain, RefreshCw, Rocket, ArrowDown, Wallet, Clock, ImagePlus, X, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { BRAINROT_UNIVERSES, type BrainrotUniverse } from '@/data/mockData';

const presetTags = ['cursed', 'wholesome rot', 'sigma', 'NPC', 'cooked'];
const universeOptions = BRAINROT_UNIVERSES.filter(u => u !== 'All');

const placeholderPrompts = [
  'angry tung tung with sunglasses...',
  'bombardiro but he\'s a sandwich...',
  'cursed frog in a business suit...',
  'skibidi toilet with wings...',
  'sigma cat in a mech suit...',
];

const loadingMessages = [
  'Cooking your brainrot...',
  'Rotting the pixels...',
  'Channeling pure brainrot energy...',
  'Summoning the rot...',
  'Almost cooked...',
];

const COOLDOWN_SECONDS = 30;

const CreateCharacter = () => {
  const [name, setName] = useState('');
  const [lore, setLore] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState<string>('');

  // Inspiration image
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);

  // Custom image upload (use your own)
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const customImageInputRef = useRef<HTMLInputElement>(null);

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [cooldown, setCooldown] = useState(0);

  const wallet = useWallet();

  const toggleTag = (t: string) => setSelectedTags(st => st.includes(t) ? st.filter(x => x !== t) : [...st, t]);

  const addCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(st => [...st, tag]);
    }
    setCustomTagInput('');
  };

  // Fetch cooldown status when wallet connects
  const fetchStatus = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const { data, error } = await supabase.functions.invoke('generate-character', {
        body: { action: 'check', walletAddress: wallet.publicKey.toBase58() },
      });
      if (error) throw error;
      if (data?.cooldownRemaining > 0) {
        setCooldown(data.cooldownRemaining);
      }
    } catch (err) {
      console.error('Failed to fetch generation status:', err);
    }
  }, [wallet.publicKey]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Cycle placeholder prompts
  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIndex(i => (i + 1) % placeholderPrompts.length), 3000);
    return () => clearInterval(interval);
  }, []);

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setLoadingMsgIndex(i => (i + 1) % loadingMessages.length), 2000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!wallet.publicKey) {
      toast({ title: 'Connect your wallet first', variant: 'destructive' });
      return;
    }
    if (!aiPrompt.trim()) {
      toast({ title: 'Enter a prompt first', variant: 'destructive' });
      return;
    }
    if (cooldown > 0) {
      toast({ title: `Cooldown active: ${cooldown}s remaining`, variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setLoadingMsgIndex(0);
    try {
      const { data, error } = await supabase.functions.invoke('generate-character', {
        body: { prompt: aiPrompt.trim(), walletAddress: wallet.publicKey.toBase58() },
      });
      if (error) throw error;
      if (data?.error === 'Cooldown active') {
        setCooldown(data.cooldownRemaining);
        toast({ title: `Cooldown: wait ${data.cooldownRemaining}s`, variant: 'destructive' });
        return;
      }
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setCooldown(COOLDOWN_SECONDS);
        toast({ title: 'Character generated!' });
      } else {
        throw new Error(data?.error || 'No image returned');
      }
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseCharacter = () => {
    detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeImage = generatedImage || customImagePreview;
  const canSubmit = activeImage && name.trim() && lore.trim() && selectedTags.length > 0 && selectedUniverse;

  const uploadCustomImage = async (): Promise<string | null> => {
    if (!customImageFile) return customImagePreview;
    const ext = customImageFile.name.split('.').pop();
    const path = `characters/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('character-images').upload(path, customImageFile);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('character-images').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmitToGallery = async () => {
    if (!wallet.publicKey) {
      toast({ title: 'Connect your wallet first', variant: 'destructive' });
      return;
    }
    if (!activeImage) {
      toast({ title: 'Generate or upload a character image first', variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
      toast({ title: 'Enter a character name', variant: 'destructive' });
      return;
    }
    if (!lore.trim()) {
      toast({ title: 'Enter lore / backstory', variant: 'destructive' });
      return;
    }
    if (selectedTags.length === 0) {
      toast({ title: 'Select at least one tag', variant: 'destructive' });
      return;
    }
    if (!selectedUniverse) {
      toast({ title: 'Select a universe', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = generatedImage;
      if (!imageUrl && customImageFile) {
        imageUrl = await uploadCustomImage();
      }
      const { error } = await supabase.from('characters').insert({
        wallet_address: wallet.publicKey.toBase58(),
        name: name.trim(),
        lore: lore.trim(),
        tags: selectedTags,
        image_url: imageUrl,
        universe: selectedUniverse,
      } as any);
      if (error) throw error;
      toast({ title: 'Character submitted to gallery!' });
      setName('');
      setLore('');
      setSelectedTags([]);
      setSelectedUniverse('');
      setGeneratedImage(null);
      setCustomImageFile(null);
      setCustomImagePreview(null);
      setAiPrompt('');
    } catch (err: any) {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchAsCoin = async () => {
    if (!activeImage) {
      toast({ title: 'Generate or upload a character image first', variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
      toast({ title: 'Enter a character name', variant: 'destructive' });
      return;
    }
    if (!lore.trim()) {
      toast({ title: 'Enter lore / backstory', variant: 'destructive' });
      return;
    }
    let imageUrl = generatedImage;
    if (!imageUrl && customImageFile) {
      try {
        imageUrl = await uploadCustomImage();
      } catch (err: any) {
        toast({ title: 'Image upload failed', description: err.message, variant: 'destructive' });
        return;
      }
    }
    navigate('/launch', {
      state: { prefill: { name, description: lore, imageUrl } },
    });
  };

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2">Create a Character</h1>
      <p className="text-muted-foreground text-sm mb-8 font-mono">Bring your brainrot vision to life</p>

      {/* AI Generate */}
      <div className="space-y-6">
        {!wallet.connected ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="font-mono text-sm text-muted-foreground">Connect your wallet to generate AI characters</p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        ) : (
          <>
            {/* Prompt input */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Describe your brainrot character</label>
              <Textarea
                className="bg-muted border-border font-mono text-lg min-h-[100px]"
                placeholder={placeholderPrompts[placeholderIndex]}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Inspiration image upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Reference / Inspiration Image (optional)</label>
              <input
                type="file"
                ref={inspirationInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setInspirationFile(file);
                    setInspirationImage(URL.createObjectURL(file));
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              {inspirationImage ? (
                <div className="relative inline-block">
                  <img src={inspirationImage} alt="Inspiration" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  <button
                    onClick={() => { setInspirationImage(null); setInspirationFile(null); }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => inspirationInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary/30 transition-colors"
                >
                  <ImagePlus className="h-4 w-4" /> Add inspiration image
                </button>
              )}
            </div>

            {/* OR divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground font-mono">OR</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Upload your own image */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Upload Your Own Image</label>
              <input
                type="file"
                ref={customImageInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCustomImageFile(file);
                    setCustomImagePreview(URL.createObjectURL(file));
                    setGeneratedImage(null);
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              {customImagePreview ? (
                <div className="relative inline-block">
                  <img src={customImagePreview} alt="Your image" className="w-32 h-32 rounded-lg object-cover border border-border" />
                  <button
                    onClick={() => { setCustomImageFile(null); setCustomImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => customImageInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary/30 transition-colors w-full justify-center"
                >
                  <Upload className="h-4 w-4" /> Upload your own character image
                </button>
              )}
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !aiPrompt.trim() || cooldown > 0}
              className="w-full font-display font-bold text-lg py-6 disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green"
            >
              {isGenerating ? (
                <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
              ) : cooldown > 0 ? (
                <><Clock className="mr-2 h-5 w-5" /> Cooldown {cooldown}s</>
              ) : (
                <><Brain className="mr-2 h-5 w-5" /> Generate Character</>
              )}
            </Button>

            {/* Loading state */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-card border border-border rounded-lg p-12 text-center"
                >
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-secondary/30 animate-spin border-t-secondary" />
                    <Brain className="absolute inset-0 m-auto h-10 w-10 text-secondary animate-pulse" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMsgIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="font-mono text-sm text-muted-foreground"
                    >
                      {loadingMessages[loadingMsgIndex]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generated image preview */}
            <AnimatePresence>
              {generatedImage && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="relative mx-auto w-fit rounded-xl p-[3px] bg-gradient-to-br from-primary via-secondary to-primary animate-pulse">
                    <div className="rounded-xl overflow-hidden bg-background">
                      <img
                        src={generatedImage}
                        alt="Generated brainrot character"
                        className="w-[400px] h-[400px] object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button variant="outline" onClick={handleGenerate} disabled={cooldown > 0} className="border-border text-muted-foreground">
                      <RefreshCw className="h-4 w-4 mr-2" /> {cooldown > 0 ? `Wait ${cooldown}s` : 'Regenerate'}
                    </Button>
                    <Button onClick={handleUseCharacter} className="bg-primary text-primary-foreground font-display font-bold hover:bg-primary/90 box-glow-green">
                      <ArrowDown className="h-4 w-4 mr-2" /> Use This Character
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Character details section */}
      <div ref={detailsRef} className="space-y-4 mt-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Character Name *</label>
          <Input className="bg-muted border-border font-mono" placeholder="e.g. Spaghettino Cuchilino" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Lore / Backstory *</label>
          <Textarea className="bg-muted border-border font-mono" placeholder="What is this creature's deal?" value={lore} onChange={e => setLore(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Universe *</label>
          <div className="flex gap-2 flex-wrap">
            {universeOptions.map(u => (
              <button
                key={u}
                onClick={() => setSelectedUniverse(u)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border whitespace-nowrap ${
                  selectedUniverse === u
                    ? 'bg-card border-primary text-foreground'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Tags *</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {presetTags.map(t => (
              <button key={t} onClick={() => toggleTag(t)} className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${selectedTags.includes(t) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{t}</button>
            ))}
          </div>
          {/* Custom tags */}
          <div className="flex gap-2 flex-wrap mb-2">
            {selectedTags.filter(t => !presetTags.includes(t)).map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-mono bg-secondary text-secondary-foreground flex items-center gap-1">
                {t}
                <button onClick={() => setSelectedTags(st => st.filter(x => x !== t))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              className="bg-muted border-border font-mono text-xs flex-1"
              placeholder="Add custom tag..."
              value={customTagInput}
              onChange={e => setCustomTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
            />
            <Button size="sm" variant="outline" onClick={addCustomTag} disabled={!customTagInput.trim()} className="border-border text-muted-foreground">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Validation hints */}
        {!activeImage && (
          <p className="text-xs text-destructive font-mono">Generate or upload a character image above first</p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSubmitToGallery}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 gradient-btn text-primary-foreground font-display font-bold rounded-xl border-0 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Submit to Gallery</>
            )}
          </Button>
          <Button
            onClick={handleLaunchAsCoin}
            disabled={!canSubmit}
            className="flex-1 bg-secondary text-secondary-foreground font-display font-bold rounded-xl hover:bg-secondary/90 box-glow-purple disabled:opacity-50"
          >
            <Rocket className="h-4 w-4 mr-2" /> Launch as Coin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCharacter;
