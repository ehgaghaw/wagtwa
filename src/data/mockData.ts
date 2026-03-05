export const BRAINROT_UNIVERSES = [
  'All',
  'Italian Brainrot',
  'Russian Brainrot',
  'Chinese Brainrot',
  'Turkish Brainrot',
  'Arabic Brainrot',
  'Japanese Brainrot',
  'Indian Brainrot',
  'American Brainrot',
  'Korean Brainrot',
  'Brazilian Brainrot',
  'Community',
] as const;

export type BrainrotUniverse = typeof BRAINROT_UNIVERSES[number];

export interface BrainrotCoin {
  id: string;
  name: string;
  ticker: string;
  description: string;
  image: string;
  avatarGradient: string;
  avatarLetter: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  bondingProgress: number;
  creator: string;
  createdAt: string;
  holders: number;
  tags: string[];
  universe: BrainrotUniverse;
}

export interface BrainrotCharacter {
  id: string;
  name: string;
  lore: string;
  image: string;
  avatarGradient: string;
  avatarLetter: string;
  tags: string[];
  votes: number;
  hasCoin: boolean;
  coinId?: string;
  universe: BrainrotUniverse;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  wallet: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  wallet: string;
  message: string;
  timestamp: string;
}

const randomAddr = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let r = '';
  for (let i = 0; i < 44; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
};

const gradients = {
  purple: 'linear-gradient(135deg, hsl(280 80% 55%), hsl(330 85% 60%))',
  green: 'linear-gradient(135deg, hsl(160 70% 40%), hsl(180 60% 50%))',
  orange: 'linear-gradient(135deg, hsl(25 90% 55%), hsl(45 95% 55%))',
  blue: 'linear-gradient(135deg, hsl(210 80% 50%), hsl(240 70% 60%))',
  pink: 'linear-gradient(135deg, hsl(330 85% 55%), hsl(350 80% 65%))',
  teal: 'linear-gradient(135deg, hsl(170 65% 45%), hsl(200 70% 55%))',
  red: 'linear-gradient(135deg, hsl(0 75% 50%), hsl(20 80% 55%))',
  indigo: 'linear-gradient(135deg, hsl(250 70% 55%), hsl(270 80% 60%))',
  amber: 'linear-gradient(135deg, hsl(35 90% 50%), hsl(55 85% 55%))',
  cyan: 'linear-gradient(135deg, hsl(185 70% 45%), hsl(200 65% 55%))',
};

export const brainrotCharacters: BrainrotCharacter[] = [
  { id: '1', name: 'Tung Tung Sahur', lore: 'The drumming menace that haunts your feed at 3AM. Tung tung tung...', image: '', avatarGradient: gradients.green, avatarLetter: 'T', tags: ['cursed', 'NPC'], votes: 4200, hasCoin: true, coinId: '1', universe: 'Turkish Brainrot' },
  { id: '2', name: 'Bombardiro Crocodilo', lore: 'Half bomber, half crocodile. 100% unhinged. Drops memes from the sky.', image: '', avatarGradient: gradients.orange, avatarLetter: 'B', tags: ['sigma', 'cursed'], votes: 3800, hasCoin: true, coinId: '2', universe: 'Italian Brainrot' },
  { id: '3', name: 'Tralalero Tralala', lore: 'The singing shark with legs. Nobody asked for this. Everyone needed it.', image: '', avatarGradient: gradients.blue, avatarLetter: 'T', tags: ['wholesome rot', 'NPC'], votes: 3500, hasCoin: true, coinId: '3', universe: 'Italian Brainrot' },
  { id: '4', name: 'Lirili Larila', lore: 'A dancing anomaly that appears when you\'ve been online too long.', image: '', avatarGradient: gradients.pink, avatarLetter: 'L', tags: ['wholesome rot'], votes: 2900, hasCoin: false, universe: 'Italian Brainrot' },
  { id: '5', name: 'Bombombini Gusini', lore: 'The explosive goose. Honk = boom. Simple as that.', image: '', avatarGradient: gradients.teal, avatarLetter: 'B', tags: ['cursed', 'sigma'], votes: 2700, hasCoin: true, coinId: '5', universe: 'Russian Brainrot' },
  { id: '6', name: 'Capuchino Assassino', lore: 'A coffee cup that chose violence. Your morning brew, weaponized.', image: '', avatarGradient: gradients.amber, avatarLetter: 'C', tags: ['sigma', 'cooked'], votes: 2500, hasCoin: false, universe: 'Italian Brainrot' },
  { id: '7', name: 'Frulli Frulla', lore: 'A sentient blender that remixes reality itself. Brrrrr.', image: '', avatarGradient: gradients.indigo, avatarLetter: 'F', tags: ['NPC', 'cooked'], votes: 2200, hasCoin: false, universe: 'Italian Brainrot' },
  { id: '8', name: 'Tiki Tiki', lore: 'Clock-obsessed entity counting down to something nobody understands.', image: '', avatarGradient: gradients.red, avatarLetter: 'T', tags: ['cursed'], votes: 1900, hasCoin: false, universe: 'Japanese Brainrot' },
  { id: '9', name: 'Brr Brr Patapim', lore: 'The cold never bothered this one. Because it IS the cold.', image: '', avatarGradient: gradients.cyan, avatarLetter: 'B', tags: ['NPC', 'wholesome rot'], votes: 1700, hasCoin: true, coinId: '9', universe: 'Italian Brainrot' },
  { id: '10', name: 'Spaghettino Cuchilino', lore: 'Italian pasta with a knife. Mama mia, indeed.', image: '', avatarGradient: gradients.red, avatarLetter: 'S', tags: ['sigma', 'cooked'], votes: 1500, hasCoin: false, universe: 'Italian Brainrot' },
];

export const mockCoins: BrainrotCoin[] = [
  { id: '1', name: 'Tung Tung Sahur', ticker: 'TUNG', description: 'The OG brainrot drumming token', image: '', avatarGradient: gradients.green, avatarLetter: 'T', price: 0.0042, priceChange24h: 69.42, marketCap: 420000, volume24h: 185000, bondingProgress: 78, creator: randomAddr(), createdAt: '2h ago', holders: 1337, tags: ['cursed'], universe: 'Turkish Brainrot' },
  { id: '2', name: 'Bombardiro Crocodilo', ticker: 'BOMB', description: 'Bombing the charts since day one', image: '', avatarGradient: gradients.orange, avatarLetter: 'B', price: 0.0028, priceChange24h: -12.5, marketCap: 280000, volume24h: 95000, bondingProgress: 45, creator: randomAddr(), createdAt: '5h ago', holders: 892, tags: ['sigma'], universe: 'Italian Brainrot' },
  { id: '3', name: 'Tralalero Tralala', ticker: 'TRALA', description: 'Singing all the way to the moon', image: '', avatarGradient: gradients.blue, avatarLetter: 'T', price: 0.0015, priceChange24h: 142.0, marketCap: 150000, volume24h: 320000, bondingProgress: 92, creator: randomAddr(), createdAt: '30m ago', holders: 2100, tags: ['wholesome rot'], universe: 'Italian Brainrot' },
  { id: '5', name: 'Bombombini Gusini', ticker: 'GOOSE', description: 'Honk if you\'re pumping', image: '', avatarGradient: gradients.teal, avatarLetter: 'B', price: 0.0008, priceChange24h: 33.3, marketCap: 80000, volume24h: 45000, bondingProgress: 22, creator: randomAddr(), createdAt: '12h ago', holders: 456, tags: ['cursed'], universe: 'Russian Brainrot' },
  { id: '9', name: 'Brr Brr Patapim', ticker: 'BRR', description: 'Cold hard gains only', image: '', avatarGradient: gradients.cyan, avatarLetter: 'B', price: 0.0003, priceChange24h: -5.2, marketCap: 30000, volume24h: 12000, bondingProgress: 11, creator: randomAddr(), createdAt: '1d ago', holders: 234, tags: ['NPC'], universe: 'Italian Brainrot' },
  { id: '6', name: 'Skibidi Toilet', ticker: 'SKBDI', description: 'The toilet that started it all', image: '', avatarGradient: gradients.purple, avatarLetter: 'S', price: 0.0099, priceChange24h: 420.69, marketCap: 990000, volume24h: 750000, bondingProgress: 99, creator: randomAddr(), createdAt: '3d ago', holders: 8900, tags: ['cursed', 'sigma'], universe: 'American Brainrot' },
  { id: '7', name: 'Ohio Rizz', ticker: 'OHIO', description: 'Only in Ohio fr fr', image: '', avatarGradient: gradients.amber, avatarLetter: 'O', price: 0.0006, priceChange24h: 15.0, marketCap: 60000, volume24h: 28000, bondingProgress: 35, creator: randomAddr(), createdAt: '8h ago', holders: 567, tags: ['cooked'], universe: 'American Brainrot' },
  { id: '8', name: 'Gyatt Lord', ticker: 'GYATT', description: 'The gyattiest token on Solana', image: '', avatarGradient: gradients.indigo, avatarLetter: 'G', price: 0.0018, priceChange24h: -8.9, marketCap: 180000, volume24h: 67000, bondingProgress: 55, creator: randomAddr(), createdAt: '4h ago', holders: 789, tags: ['sigma'], universe: 'American Brainrot' },
];

export const mockTrades: Trade[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i),
  type: Math.random() > 0.5 ? 'buy' : 'sell',
  amount: +(Math.random() * 10).toFixed(2),
  price: +(Math.random() * 0.01).toFixed(6),
  wallet: randomAddr().slice(0, 8) + '...' + randomAddr().slice(-4),
  timestamp: `${Math.floor(Math.random() * 60)}m ago`,
}));

export const mockChat: ChatMessage[] = [
  { id: '1', wallet: 'Degen42...xyz', message: 'LFG this is going to 1B mcap', timestamp: '2m ago' },
  { id: '2', wallet: 'BrainRot...abc', message: 'just aped in with my rent money no cap', timestamp: '5m ago' },
  { id: '3', wallet: 'Sigma69...def', message: 'bonding curve about to graduate lets gooo', timestamp: '8m ago' },
  { id: '4', wallet: 'NPC_Andy...ghi', message: 'this is the most unhinged thing ive ever bought', timestamp: '12m ago' },
  { id: '5', wallet: 'CookedFr...jkl', message: 'im financially cooked but still buying more', timestamp: '15m ago' },
];

export const mockCandlestickData = Array.from({ length: 50 }, (_, i) => {
  const base = 0.003 + Math.sin(i / 5) * 0.001;
  const open = base + (Math.random() - 0.5) * 0.0005;
  const close = base + (Math.random() - 0.5) * 0.0005;
  const high = Math.max(open, close) + Math.random() * 0.0003;
  const low = Math.min(open, close) - Math.random() * 0.0003;
  return { time: i, open: +open.toFixed(6), close: +close.toFixed(6), high: +high.toFixed(6), low: +low.toFixed(6), volume: Math.floor(Math.random() * 50000) };
});
