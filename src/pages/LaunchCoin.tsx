import { useState, useRef, useEffect } from 'react';
import { Rocket, ArrowLeft, ArrowRight, Upload, Check, Loader2, ExternalLink, AlertTriangle, Sparkles, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BRAINROT_UNIVERSES, type BrainrotUniverse } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const LaunchCoin = () => {
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    ticker: '',
    description: '',
    devBuy: '0',
    twitter: '',
    telegram: '',
    website: '',
    universe: 'Italian Brainrot' as BrainrotUniverse,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<'idle' | 'creating' | 'done' | 'failed'>('idle');
  const [launchResult, setLaunchResult] = useState<{ mintAddress: string; transactionSignature: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'ai'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefill) {
      setForm(f => ({
        ...f,
        name: prefill.name || f.name,
        ticker: (prefill.name || '').toUpperCase().replace(/\s+/g, '').slice(0, 10) || f.ticker,
        description: prefill.description || prefill.lore || f.description,
        universe: prefill.universe || f.universe,
      }));
      if (prefill.imageUrl) {
        setImagePreview(prefill.imageUrl);
      }
    }
  }, []);

  const wallet = useWallet();
  const walletPublicKey = wallet.publicKey?.toBase58() || null;
  const devBuyAmount = Math.max(0, parseFloat(form.devBuy) || 0);

  const buildLaunchAuthProof = async () => {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error('Connect a wallet that supports message signing');
    }

    const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const message = `ROT_LAUNCH:${wallet.publicKey.toBase58()}:${nonce}:${Date.now()}`;
    const signatureBytes = await wallet.signMessage(new TextEncoder().encode(message));
    const signatureBase64 = btoa(String.fromCharCode(...signatureBytes));

    return {
      launchAuthMessage: message,
      launchAuthSignature: signatureBase64,
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateAI = async () => {
    const prompt = aiPrompt.trim() || form.name;
    if (!prompt) {
      toast({ title: 'Enter a character name or AI prompt first', variant: 'destructive' });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-character', {
        body: {
          prompt: `Create a brainrot meme character: ${prompt}. Style: bold, cartoonish, thick outlines, flat colors, meme energy, suitable for a crypto coin logo. White background.`,
          walletAddress: wallet.publicKey?.toBase58() || 'anonymous',
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setImagePreview(data.imageUrl);
        setImageFile(null); // AI-generated, no file
        toast({ title: 'Character generated!' });
      }
    } catch (err: any) {
      toast({ title: 'AI generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const uploadImageToStorage = async (): Promise<string | null> => {
    if (!imageFile) return imagePreview;
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('character-images').upload(fileName, imageFile);
    if (error) { console.error('Image upload error:', error); return null; }
    const { data: urlData } = supabase.storage.from('character-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleLaunch = async () => {
    if (!walletPublicKey) {
      toast({ title: 'Connect your wallet first', variant: 'destructive' });
      return;
    }

    if (!form.name || !form.ticker) {
      toast({ title: 'Fill in name and ticker', variant: 'destructive' });
      return;
    }

    setIsLaunching(true);
    setLaunchStatus('creating');
    setErrorMessage(null);

    try {
      const { launchAuthMessage, launchAuthSignature } = await buildLaunchAuthProof();
      const imageUrl = await uploadImageToStorage();
      if (!imageUrl && imageFile) throw new Error('Failed to upload image');

      const { data, error } = await supabase.functions.invoke('launch-token', {
        body: {
          userWallet: walletPublicKey,
          launchAuthMessage,
          launchAuthSignature,
          tokenName: form.name,
          tokenSymbol: form.ticker,
          tokenDescription: form.description,
          tokenImageUrl: imageUrl || '',
          devBuyAmount,
          universe: form.universe,
          twitter: form.twitter || null,
          telegram: form.telegram || null,
          website: form.website || null,
        },
      });

      if (error) throw new Error(error.message || 'Token creation failed');
      if (data?.error) throw new Error(data.error);

      setLaunchResult({ mintAddress: data.mintAddress, transactionSignature: data.transactionSignature });
      setLaunchStatus('done');
      toast({ title: 'Token launched!', description: `Mint: ${data.mintAddress?.slice(0, 8)}...` });
    } catch (err: any) {
      console.error('Launch error:', err);
      setLaunchStatus('failed');
      setErrorMessage(err.message || 'Launch failed');
      toast({ title: 'Launch failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsLaunching(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-2">Launch a Brainrot Character</h1>
      <p className="text-muted-foreground text-sm mb-8">Deploy your brainrot on Solana via Pump.fun's bonding curve</p>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>{step > s ? <Check className="h-4 w-4" /> : s}</div>
            {s < totalSteps && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold mb-4">Your Character & Coin Details</h2>

              {/* Image section with upload/AI toggle */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Character Image *</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                      imageMode === 'upload' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" /> Upload
                  </button>
                  <button
                    onClick={() => setImageMode('ai')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                      imageMode === 'ai' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" /> AI Generate
                  </button>
                </div>

                {imageMode === 'upload' ? (
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer w-32 h-32 flex flex-col items-center justify-center"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <><Upload className="h-6 w-6 text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Click to upload</p></>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        className="bg-muted border-border flex-1"
                        placeholder="Describe your character (or leave blank to use name)"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                      />
                      <Button
                        onClick={handleGenerateAI}
                        disabled={isGeneratingImage}
                        className="bg-primary text-primary-foreground shrink-0"
                        size="sm"
                      >
                        {isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </Button>
                    </div>
                    {imagePreview && (
                      <div className="w-32 h-32 rounded-xl overflow-hidden border border-border">
                        <img src={imagePreview} alt="Generated" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {isGeneratingImage && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Generating your brainrot character...
                      </p>
                    )}
                  </div>
                )}

                {imagePreview && (
                  <button
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="text-xs text-destructive hover:underline mt-2"
                  >
                    Remove image
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Coin Name</label>
                <Input className="bg-muted border-border" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ticker Symbol (max 10 chars)</label>
                <Input className="bg-muted border-border" maxLength={10} placeholder="e.g. TUNG" value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Textarea className="bg-muted border-border" placeholder="What's the lore?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Brainrot Universe</label>
                <select className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground" value={form.universe} onChange={e => setForm(f => ({ ...f, universe: e.target.value as BrainrotUniverse }))}>
                  {BRAINROT_UNIVERSES.filter(u => u !== 'All').map(u => (<option key={u} value={u}>{u}</option>))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold mb-4">Launch Settings</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dev Buy Amount (SOL)</label>
                <Input type="number" min="0" step="0.001" className="bg-muted border-border" placeholder="0" value={form.devBuy} onChange={e => setForm(f => ({ ...f, devBuy: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">Optional: SOL used for initial buy on launch.</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Twitter/X</label>
                <Input className="bg-muted border-border" placeholder="https://x.com/..." value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telegram</label>
                <Input className="bg-muted border-border" placeholder="https://t.me/..." value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">TikTok / Website</label>
                <Input className="bg-muted border-border" placeholder="https://..." value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold mb-4">Review & Launch</h2>
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Coin" className="w-16 h-16 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><Upload className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                  <div>
                    <p className="font-display text-xl font-bold">{form.name || 'Unnamed'}</p>
                    <p className="text-sm text-primary">${form.ticker || 'TICKER'}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{form.description || 'No description'}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Dev Buy</p>
                    <p className="font-bold">{devBuyAmount} SOL</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Platform</p>
                    <p className="font-bold">Pump.fun</p>
                  </div>
                </div>

                {!imageFile && !imagePreview && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Go back and upload or generate a character image
                  </p>
                )}
              </div>

              {launchStatus === 'done' && launchResult ? (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
                  <p className="font-display font-bold text-primary">Character Launched!</p>
                  <p className="text-xs text-muted-foreground">Mint: {launchResult.mintAddress}</p>
                  <div className="flex gap-4">
                    <a href={`https://pump.fun/${launchResult.mintAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> View on Pump.fun
                    </a>
                    <a href={`https://solscan.io/tx/${launchResult.transactionSignature}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> View on Solscan
                    </a>
                  </div>
                </div>
              ) : launchStatus === 'failed' ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-2">
                  <p className="font-display font-bold text-destructive">Launch Failed</p>
                  <p className="text-xs text-muted-foreground">{errorMessage || 'Something went wrong.'}</p>
                  <Button onClick={() => { setLaunchStatus('idle'); setErrorMessage(null); }} variant="outline" size="sm" className="mt-2">Try Again</Button>
                </div>
              ) : (
                <Button
                  onClick={handleLaunch}
                  disabled={isLaunching || (!imageFile && !imagePreview) || !form.name || !form.ticker}
                  className="w-full gradient-btn text-primary-foreground font-display font-bold text-lg py-6 rounded-xl border-0 disabled:opacity-50"
                >
                  {isLaunching ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Your Character...</>
                  ) : (
                    <><Rocket className="mr-2 h-5 w-5" /> Launch on Pump.fun</>
                  )}
                </Button>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Your character will be deployed on Pump.fun's bonding curve on Solana
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="border-border text-muted-foreground rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < totalSteps && (
          <Button onClick={() => setStep(s => s + 1)} className="gradient-btn text-primary-foreground font-display font-bold rounded-xl border-0">
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default LaunchCoin;
