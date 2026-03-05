import { useState, useEffect, useCallback } from 'react';

interface DexScreenerData {
  priceUsd: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
}

type DexDataMap = Record<string, DexScreenerData>;

const DEXSCREENER_API = 'https://api.dexscreener.com/tokens/v1/solana';

export function useDexScreenerBatch(mintAddresses: string[]) {
  const [data, setData] = useState<DexDataMap>({});
  const [loading, setLoading] = useState(false);

  const fetchPrices = useCallback(async () => {
    const validAddresses = mintAddresses.filter(Boolean);
    if (validAddresses.length === 0) return;

    setLoading(true);
    try {
      // DexScreener supports comma-separated addresses (up to 30)
      const chunks: string[][] = [];
      for (let i = 0; i < validAddresses.length; i += 30) {
        chunks.push(validAddresses.slice(i, i + 30));
      }

      const results: DexDataMap = {};

      await Promise.all(
        chunks.map(async (chunk) => {
          try {
            const res = await fetch(`${DEXSCREENER_API}/${chunk.join(',')}`);
            if (!res.ok) return;
            const json = await res.json();
            const pairs = Array.isArray(json) ? json : json?.pairs || [];
            
            // Group by base token address and pick the highest-liquidity pair
            const bestPairs: Record<string, any> = {};
            for (const pair of pairs) {
              const addr = pair.baseToken?.address;
              if (!addr) continue;
              if (!bestPairs[addr] || (pair.liquidity?.usd || 0) > (bestPairs[addr].liquidity?.usd || 0)) {
                bestPairs[addr] = pair;
              }
            }

            for (const [addr, pair] of Object.entries(bestPairs)) {
              results[addr] = {
                priceUsd: parseFloat(pair.priceUsd || '0'),
                priceChange24h: pair.priceChange?.h24 || 0,
                marketCap: pair.marketCap || pair.fdv || 0,
                volume24h: pair.volume?.h24 || 0,
                liquidity: pair.liquidity?.usd || 0,
              };
            }
          } catch (e) {
            console.error('DexScreener fetch error:', e);
          }
        })
      );

      setData(results);
    } finally {
      setLoading(false);
    }
  }, [mintAddresses.join(',')]);

  useEffect(() => {
    fetchPrices();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { data, loading };
}
