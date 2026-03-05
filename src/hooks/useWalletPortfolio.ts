import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface TokenHolding {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export interface WalletPortfolio {
  connected: boolean;
  address: string | null;
  solBalance: number;
  tokens: TokenHolding[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useWalletPortfolio = (): WalletPortfolio => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!publicKey || !connected) {
      setSolBalance(0);
      setTokens([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Fetch all SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const holdings: TokenHolding[] = tokenAccounts.value
        .map(account => {
          const parsed = account.account.data.parsed.info;
          const amount = parsed.tokenAmount;
          return {
            mint: parsed.mint as string,
            amount: Number(amount.amount),
            decimals: amount.decimals as number,
            uiAmount: amount.uiAmount as number,
          };
        })
        .filter(t => t.uiAmount > 0) // Only show tokens with balance
        .sort((a, b) => b.uiAmount - a.uiAmount);

      setTokens(holdings);
    } catch (err: any) {
      console.error('Failed to fetch portfolio:', err);
      setError(err.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, connection]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    connected,
    address: publicKey?.toBase58() || null,
    solBalance,
    tokens,
    loading,
    error,
    refresh: fetchPortfolio,
  };
};
