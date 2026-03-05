import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Sparkles, Brain, RefreshCw, Rocket, ArrowDown, Wallet, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const tags = ['cursed', 'wholesome rot', 'sigma', 'NPC', 'cooked'];
const heads = ['Clown', 'Skull', 'Alien', 'Robot', 'Frog', 'Devil', 'Moai', 'Ghost'];
const accessories = ['Top Hat', 'Shades', 'Crown', 'Mask', 'Cap', 'Diamond', 'Flame', 'Star'];

const COST_SOL = 0.01;
const FREE_GENERATIONS = 3;
// Placeholder treasury — user will provide the real address later
const TREASURY_WALLET = 'ROTtreasuryWa11etAddressP1aceho1der111111';

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

const CreateCharacter = () => {
  const [name, setName] = useState('');
  const [lore, setLore] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [mode, setMode] = useState<'builder' | 'upload' | 'ai'>('ai');

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const detailsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Rate limiting state
  const [genStatus, setGenStatus] = useState<{
    generationCount: number;
    freeRemaining: number;
    requiresPayment: boolean;
    cooldownRemaining: number;
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isPaying, setIsPaying] = useState(false);

  const wallet = useWallet();
  const { connection } = useConnection();

  const toggleTag = (t: string) => setSelectedTags(st => st.includes(t) ? st.filter(x => x !== t) : [...st, t]);

  // Fetch generation status when wallet connects
  const fetchStatus = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const { data, error } = await supabase.functions.invoke('generate-character', {
        body: { action: 'check', walletAddress: wallet.publicKey.toBase58() },
      });
      if (error) throw error;
      setGenStatus(data);
      if (data.cooldownRemaining > 0) {
        setCooldown(data.cooldownRemaining);
      }
    } catch (err) {
      console.error('Failed to fetch generation status:', err);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Cycle placeholder prompts
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % placeholderPrompts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex(i => (i + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handlePayment = async (): Promise<boolean> => {
    if (!wallet.publicKey || !wallet.signTransaction) return false;
    setIsPaying(true);
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports: Math.floor(COST_SOL * LAMPORTS_PER_SOL),
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signed = await wallet.signTransaction(transaction);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, 'confirmed');
      toast({ title: 'Payment confirmed!', description: `${COST_SOL} SOL sent` });
      return true;
    } catch (err: any) {
      toast({ title: 'Payment failed', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setIsPaying(false);
    }
  };

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

    // Check if payment is needed
    if (genStatus?.requiresPayment) {
      const paid = await handlePayment();
      if (!paid) return;
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
        setGenStatus({
          generationCount: data.generationCount,
          freeRemaining: data.freeRemaining,
          requiresPayment: data.requiresPayment,
          cooldownRemaining: 30,
        });
        setCooldown(30);
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

  const handleLaunchAsCoin = () => {
    navigate('/launch', {
      state: { prefill: { name, description: lore, imageUrl: generatedImage } },
    });
  };

  const isFree = genStatus ? !genStatus.requiresPayment : true;
  const freeRemaining = genStatus?.freeRemaining ?? FREE_GENERATIONS;

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2">Create a Character</h1>
      <p className="text-muted-foreground text-sm mb-8 font-mono">Bring your brainrot vision to life</p>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'ai' as const, label: 'AI Generate', icon: Brain },
          { key: 'builder' as const, label: 'Character Builder', icon: Sparkles },
          { key: 'upload' as const, label: 'Upload Art', icon: Upload },
        ]).map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              mode === m.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {/* AI Generate Tab */}
      {mode === 'ai' && (
        <div className="space-y-6">
          {/* Wallet gate */}
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
              {/* Generation counter */}
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className={`h-5 w-5 ${isFree ? 'text-primary' : 'text-secondary'}`} />
                  <div>
                    {isFree ? (
                      <p className="font-mono text-sm">
                        <span className="text-primary font-bold">{freeRemaining}/{FREE_GENERATIONS}</span>{' '}
                        <span className="text-muted-foreground">free generations remaining</span>
                      </p>
                    ) : (
                      <p className="font-mono text-sm">
                        <span className="text-secondary font-bold">{COST_SOL} SOL</span>{' '}
                        <span className="text-muted-foreground">per generation</span>
                      </p>
                    )}
                  </div>
                </div>
                {cooldown > 0 && (
                  <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {cooldown}s
                  </div>
                )}
              </div>

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

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt.trim() || cooldown > 0 || isPaying}
                className={`w-full font-display font-bold text-lg py-6 disabled:opacity-50 ${
                  genStatus?.requiresPayment
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 box-glow-purple'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green'
                }`}
              >
                {isPaying ? (
                  <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Sending {COST_SOL} SOL...</>
                ) : isGenerating ? (
                  <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                ) : cooldown > 0 ? (
                  <><Clock className="mr-2 h-5 w-5" /> Cooldown {cooldown}s</>
                ) : genStatus?.requiresPayment ? (
                  <><Zap className="mr-2 h-5 w-5" /> Pay {COST_SOL} SOL & Generate</>
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
                      <Button onClick={handleLaunchAsCoin} className="bg-secondary text-secondary-foreground font-display font-bold hover:bg-secondary/90 box-glow-purple">
                        <Rocket className="h-4 w-4 mr-2" /> Launch as Coin
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      {/* Character Builder Tab */}
      {mode === 'builder' && (
        <div className="space-y-6">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Head / Base</label>
            <div className="flex gap-2 flex-wrap">
              {heads.map(h => (
                <button key={h} onClick={() => setSelectedHead(h)} className={`text-sm p-3 rounded-xl border font-medium transition-all ${selectedHead === h ? 'border-primary bg-primary/10 glow-pink' : 'border-border bg-card hover:border-primary/30'}`}>{h}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Accessory</label>
            <div className="flex gap-2 flex-wrap">
              {accessories.map(a => (
                <button key={a} onClick={() => setSelectedAccessory(a)} className={`text-sm p-3 rounded-xl border font-medium transition-all ${selectedAccessory === a ? 'border-secondary bg-secondary/10 glow-purple' : 'border-border bg-card hover:border-secondary/30'}`}>{a}</button>
              ))}
            </div>
          </div>
          {(selectedHead || selectedAccessory) && (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="text-xl font-display font-bold">{selectedHead} + {selectedAccessory}</div>
            </div>
          )}
        </div>
      )}

      {/* Upload Art Tab */}
      {mode === 'upload' && (
        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-mono">Click or drag to upload character art</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}

      {/* Character details section */}
      <div ref={detailsRef} className="space-y-4 mt-6">
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
              <button key={t} onClick={() => toggleTag(t)} className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${selectedTags.includes(t) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{t}</button>
            ))}
          </div>
        </div>
        <Button className="w-full gradient-btn text-primary-foreground font-display font-bold rounded-xl border-0">
          <Sparkles className="h-4 w-4 mr-2" /> Submit to Gallery
        </Button>
      </div>
    </div>
  );
};

export default CreateCharacter;
