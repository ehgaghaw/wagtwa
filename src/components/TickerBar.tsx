import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CoinAvatar from './CoinAvatar';

interface TickerCoin {
  id: string;
  name: string;
  ticker: string;
  image: string;
  avatarGradient: string;
  avatarLetter: string;
}

const TickerBar = () => {
  const [coins, setCoins] = useState<TickerCoin[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.functions.invoke('character-vote', {
        body: { action: 'ticker' },
      });

      if (error || !data) return;
      const rows = (data as any).coins || [];

      setCoins(rows.map((c: any) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        image: c.image_url || '',
        avatarGradient: 'linear-gradient(135deg, hsl(280 80% 55%), hsl(330 85% 60%))',
        avatarLetter: c.name.charAt(0).toUpperCase(),
      })));
    };

    fetch();

    const poll = window.setInterval(() => {
      fetch();
    }, 8000);

    return () => {
      window.clearInterval(poll);
    };
  }, []);

  if (coins.length === 0) return null;

  const items = [...coins, ...coins];

  return (
    <div className="border-b border-border bg-card overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-1.5">
        {items.map((coin, i) => (
          <div key={`${coin.id}-${i}`} className="flex items-center gap-1.5 mx-5 text-xs">
            <CoinAvatar coin={coin} size={16} />
            <span className="text-foreground font-medium">${coin.ticker}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
