import type { BrainrotCoin } from '@/data/mockData';

interface CoinAvatarProps {
  coin: BrainrotCoin;
  size?: number;
}

const CoinAvatar = ({ coin, size = 48 }: CoinAvatarProps) => {
  if (coin.image) {
    return (
      <img
        src={coin.image}
        alt={coin.name}
        className="rounded-full object-cover border-2 border-border"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
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
};

export default CoinAvatar;
