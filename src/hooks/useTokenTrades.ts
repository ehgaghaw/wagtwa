import { useEffect, useState } from 'react';
import { subscribeTokenTrades } from '@/services/pumpWebSocket';

export interface TokenTrade {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: 'buy' | 'sell';
  tokenAmount: number;
  solAmount: number;
  newTokenBalance: number;
  marketCapSol: number;
  timestamp: number;
}

export function useTokenTrades(mint: string | undefined, maxItems = 50) {
  const [trades, setTrades] = useState<TokenTrade[]>([]);

  useEffect(() => {
    if (!mint) return;
    setTrades([]);
    const unsub = subscribeTokenTrades(mint, (data) => {
      setTrades(prev => [data, ...prev].slice(0, maxItems));
    });
    return unsub;
  }, [mint, maxItems]);

  return trades;
}
