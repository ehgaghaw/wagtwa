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
      const { data } = await supabase
        .from('launched_coins')
        .select('id, name, ticker, image_url')
        .order('created_at', { ascending: false });

      if (data) {
        setCoins(data.map(c => ({
          id: c.id,
          name: c.name,
          ticker: c.ticker,
          image: c.image_url || '',
          avatarGradient: 'linear-gradient(135deg, hsl(280 80% 55%), hsl(330 85% 60%))',
          avatarLetter: c.name.charAt(0).toUpperCase(),
        })));
      }
    };

    fetch();

    const channel = supabase
      .channel('ticker-launched-coins')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'launched_coins' }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
