import { useState, useRef, useEffect } from 'react';
import { Rocket, ArrowLeft, ArrowRight, Upload, Check, Loader2, ExternalLink, AlertTriangle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BRAINROT_UNIVERSES, type BrainrotUniverse } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Replace this with your actual proxy wallet address after creating it
const PROXY_WALLET_ADDRESS = 'YOUR_PROXY_WALLET_ADDRESS';
const LAUNCH_FEE_SOL = 0.02;

const LaunchCoin = () => {
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    ticker: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
    universe: 'Italian Brainrot' as BrainrotUniverse,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<'idle' | 'paying' | 'creating' | 'done' | 'failed'>('idle');
  const [launchResult, setLaunchResult] = useState<{ mintAddress: string; launchId: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  const { connection } = useConnection();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const uploadImageToStorage = async (): Promise<string | null> => {
    if (!imageFile) return imagePreview; // might be a URL from prefill

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage
      .from('character-images')
      .upload(fileName, imageFile);

    if (error) {
      console.error('Image upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('character-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handlePayAndLaunch = async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.sendTransaction) {
      toast({ title: 'Connect your wallet first', variant: 'destructive' });
      return;
    }

    if (PROXY_WALLET_ADDRESS === 'YOUR_PROXY_WALLET_ADDRESS') {
      toast({ title: 'Proxy wallet not configured', description: 'The platform proxy wallet address needs to be set up.', variant: 'destructive' });
      return;
    }

    setIsLaunching(true);
    setLaunchStatus('paying');
    setErrorMessage(null);

    try {
      // Step 1: Upload image to storage
      const imageUrl = await uploadImageToStorage();
      if (!imageUrl && imageFile) {
        throw new Error('Failed to upload image');
      }

      // Step 2: Create a simple SOL transfer transaction
      const proxyWalletPubkey = new PublicKey(PROXY_WALLET_ADDRESS);
      const lamports = Math.floor(LAUNCH_FEE_SOL * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: proxyWalletPubkey,
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Send the simple SOL transfer — this will NOT be flagged by Blowfish
      const paymentSignature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(paymentSignature, 'confirmed');

      toast({ title: 'Payment sent!', description: 'Creating your token...' });
      setLaunchStatus('creating');

      // Step 3: Call backend to create the token
      const { data, error } = await supabase.functions.invoke('launch-token', {
        body: {
          userWallet: wallet.publicKey.toBase58(),
          paymentSignature,
          tokenName: form.name,
          tokenSymbol: form.ticker,
          tokenDescription: form.description,
          tokenImageUrl: imageUrl || '',
          solAmount: LAUNCH_FEE_SOL,
          universe: form.universe,
          twitter: form.twitter || null,
          telegram: form.telegram || null,
          website: form.website || null,
        },
      });

      if (error) {
        throw new Error(error.message || 'Token creation failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setLaunchResult({
        mintAddress: data.mintAddress,
        launchId: data.launchId,
      });
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
      <h1 className="font-display text-3xl font-bold mb-2">Launch a Coin</h1>
      <p className="text-muted-foreground text-sm mb-8">Deploy your brainrot on Solana via Pump.fun's bonding curve</p>

      {/* Steps indicator */}
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

              {/* Image upload */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Character Image / Coin Logo *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer w-32 h-32 flex flex-col items-center justify-center"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">{imageFile ? imageFile.name : 'Click to upload'}</p>
                    </>
                  )}
                </div>
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
                <select
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  value={form.universe}
                  onChange={e => setForm(f => ({ ...f, universe: e.target.value as BrainrotUniverse }))}
                >
                  {BRAINROT_UNIVERSES.filter(u => u !== 'All').map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold mb-4">Social Links (Optional)</h2>
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
              <div className="glass-card rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Coin" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-display text-xl font-bold">{form.name || 'Unnamed Coin'}</p>
                    <p className="text-sm text-primary">${form.ticker || 'TICKER'}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{form.description || 'No description'}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Launch Fee</p>
                    <p className="font-bold">{LAUNCH_FEE_SOL} SOL</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Platform</p>
                    <p className="font-bold">Pump.fun</p>
                  </div>
                </div>

                <div className="bg-accent/30 border border-accent/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                    <Wallet className="h-3 w-3" /> How it works
                  </p>
                  <p>You'll send a simple {LAUNCH_FEE_SOL} SOL payment. Our platform then creates your token on Pump.fun on your behalf. This avoids wallet security warnings.</p>
                </div>

                {!wallet.connected && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Connect your wallet to launch
                  </p>
                )}
                {!imageFile && !imagePreview && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Go back and upload a coin image
                  </p>
                )}
              </div>

              {launchStatus === 'done' && launchResult ? (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
                  <p className="font-display font-bold text-primary">Token Launched!</p>
                  <p className="text-xs text-muted-foreground">Mint: {launchResult.mintAddress}</p>
                  <a href={`https://pump.fun/${launchResult.mintAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> View on Pump.fun
                  </a>
                </div>
              ) : launchStatus === 'failed' ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-2">
                  <p className="font-display font-bold text-destructive">Launch Failed</p>
                  <p className="text-xs text-muted-foreground">{errorMessage || 'Something went wrong. Your payment may need to be refunded.'}</p>
                  <Button
                    onClick={() => { setLaunchStatus('idle'); setErrorMessage(null); }}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handlePayAndLaunch}
                  disabled={isLaunching || !wallet.connected || (!imageFile && !imagePreview)}
                  className="w-full gradient-btn text-primary-foreground font-display font-bold text-lg py-6 rounded-xl border-0 disabled:opacity-50"
                >
                  {launchStatus === 'paying' ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending Payment...</>
                  ) : launchStatus === 'creating' ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Your Token...</>
                  ) : (
                    <><Rocket className="mr-2 h-5 w-5" /> Pay {LAUNCH_FEE_SOL} SOL & Launch</>
                  )}
                </Button>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Your token will be deployed on Pump.fun's bonding curve on Solana
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
