import * as React from 'react';

interface CoinAvatarCoin {
  name: string;
  image: string;
  avatarGradient: string;
  avatarLetter: string;
}

interface CoinAvatarProps {
  coin: CoinAvatarCoin;
  size?: number;
}

const CoinAvatar = React.forwardRef<HTMLDivElement | HTMLImageElement, CoinAvatarProps>(({ coin, size = 48 }, ref) => {
  if (coin.image) {
    return (
      <img
        ref={ref as React.Ref<HTMLImageElement>}
        src={coin.image}
        alt={coin.name}
        className="rounded-full object-cover border-2 border-border"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className="rounded-full flex items-center justify-center border-2 border-border/50 font-display font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: coin.avatarGradient,
        fontSize: size * 0.4,
      }}
    >
      {coin.avatarLetter}
    </div>
  );
});

CoinAvatar.displayName = 'CoinAvatar';

export default CoinAvatar;
