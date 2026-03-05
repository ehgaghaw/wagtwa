import { useEffect, useState } from 'react';
import { subscribeNewTokens } from '@/services/pumpWebSocket';

export interface NewToken {
  signature: string;
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  traderPublicKey: string;
  initialBuy: number;
  marketCapSol: number;
  timestamp: number;
}

export function useNewTokens(maxItems = 20) {
  const [tokens, setTokens] = useState<NewToken[]>([]);

  useEffect(() => {
    const unsub = subscribeNewTokens((data) => {
      setTokens(prev => [data, ...prev].slice(0, maxItems));
    });
    return unsub;
  }, [maxItems]);

  return tokens;
}
