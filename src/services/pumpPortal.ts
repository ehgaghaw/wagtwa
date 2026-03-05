import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PROXY_BASE = `${SUPABASE_URL}/functions/v1/pump-proxy`;

export interface TokenMetadataInput {
  name: string;
  symbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  image: File;
}

export interface TradeParams {
  action: 'buy' | 'sell';
  mint: string;
  amount: number | string;
  denominatedInSol: boolean;
  slippage?: number;
  priorityFee?: number;
}

/** Upload metadata + image to IPFS via proxy */
export async function uploadToIPFS(meta: TokenMetadataInput): Promise<string> {
  const formData = new FormData();
  formData.append('file', meta.image);
  formData.append('name', meta.name);
  formData.append('symbol', meta.symbol);
  formData.append('description', meta.description);
  formData.append('showName', 'true');
  if (meta.twitter) formData.append('twitter', meta.twitter);
  if (meta.telegram) formData.append('telegram', meta.telegram);
  if (meta.website) formData.append('website', meta.website);

  const res = await fetch(`${PROXY_BASE}?action=ipfs`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(data.error || `IPFS upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.metadataUri;
}

/** Create a new token via PumpPortal proxy */
export async function createToken(
  wallet: WalletContextState,
  connection: Connection,
  meta: TokenMetadataInput,
  initialBuySOL: number,
): Promise<{ signature: string; mintAddress: string }> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // Step 1: Upload to IPFS
  const metadataUri = await uploadToIPFS(meta);

  // Step 2: Generate mint keypair
  const mintKeypair = Keypair.generate();

  // Step 3: Get transaction from PumpPortal via proxy
  const body = {
    publicKey: wallet.publicKey.toBase58(),
    action: 'create',
    tokenMetadata: {
      name: meta.name,
      symbol: meta.symbol,
      uri: metadataUri,
    },
    mint: mintKeypair.publicKey.toBase58(),
    denominatedInSol: 'true',
    amount: initialBuySOL,
    slippage: 10,
    priorityFee: 0.0005,
    pool: 'pump',
  };

  const res = await fetch(`${PROXY_BASE}?action=trade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(data.error || `PumpPortal create failed: ${res.statusText}`);
  }

  // Step 4: Deserialize, sign, send
  const txData = await res.arrayBuffer();
  const tx = VersionedTransaction.deserialize(new Uint8Array(txData));

  // Mint keypair must co-sign
  tx.sign([mintKeypair]);

  // User wallet signs
  const signedTx = await wallet.signTransaction(tx);

  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(signature, 'confirmed');

  return { signature, mintAddress: mintKeypair.publicKey.toBase58() };
}

/** Buy or sell tokens via PumpPortal proxy */
export async function tradeToken(
  wallet: WalletContextState,
  connection: Connection,
  params: TradeParams,
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const body = {
    publicKey: wallet.publicKey.toBase58(),
    action: params.action,
    mint: params.mint,
    denominatedInSol: String(params.denominatedInSol),
    amount: params.amount,
    slippage: params.slippage ?? 10,
    priorityFee: params.priorityFee ?? 0.0005,
    pool: 'pump',
  };

  const res = await fetch(`${PROXY_BASE}?action=trade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(data.error || `Trade failed: ${res.statusText}`);
  }

  const txData = await res.arrayBuffer();
  const tx = VersionedTransaction.deserialize(new Uint8Array(txData));
  const signedTx = await wallet.signTransaction(tx);

  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}
