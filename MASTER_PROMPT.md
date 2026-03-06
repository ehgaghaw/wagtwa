# 🧠 ROT — The Brainrot Launchpad (Master Rebuild Prompt)

Build a **Solana memecoin launchpad** called **"ROT"** — a dark-themed, neon-green-accented web app where users can create AI-generated "brainrot" meme characters, submit them to a gallery, vote on them, and launch them as tokens on **Pump.fun** via a proxy wallet system. The app uses **React + Vite + Tailwind CSS + TypeScript + Framer Motion + Supabase (Lovable Cloud) + Solana wallet-adapter**.

---

## DESIGN SYSTEM

- **Theme**: Pure dark. Background `hsl(0 0% 4%)`, cards `hsl(0 0% 7%)`, borders `hsl(0 0% 10%)`.
- **Primary color**: Neon green `hsl(135 100% 50%)` — used for accents, active states, CTA buttons.
- **Destructive**: `hsl(0 72% 60%)`.
- **Fonts**: `Inter` for body, `Space Mono` for monospaced numbers (`.font-mono-num`).
- **Special effects**: `.glitch-rainbow` CSS animation on the homepage H1 ("The Brainrot Launchpad") — combines glitch text-shadow shifts with rainbow color cycling.
- **Marquee ticker**: Infinite horizontal scroll of launched coin tickers using CSS `@keyframes marquee`.
- **Scrollbar**: Custom dark scrollbar (6px, dark track/thumb).
- **Wallet adapter button overrides**: Custom CSS to make the Solana wallet button compact — transparent bg, neon green border, shows "Connect Wallet" text or shortened address.

---

## PAGES & ROUTES

### `/` — Home (Index)
- Large "ROT" text + glitch-rainbow H1 "The Brainrot Launchpad"
- Tagline: "Launch Your Brainrot. Let it Rot."
- Two animated CTAs: "Launch a Brainrot Character ✦" (pulsing scale) and "Explore →" (sliding arrow)
- Grid of trending coins fetched from `launched_coins` table (realtime subscription on INSERT)
- Each coin renders as a `CoinCard` component

### `/explore` — Explore
- Tabs: "Live Trends" (newest first, green dot indicator) and "Trending" (sorted by market cap)
- `UniverseFilter` component — horizontally scrollable pill buttons for brainrot universes (Italian, Russian, Chinese, Turkish, Arabic, Japanese, Indian, American, Korean, Brazilian + "All")
- Search input with magnifying glass icon
- Token list in Frenzy-style layout: 72px square thumbnail on left, name+ticker+description+creator info center, market cap + volume + ATH bar + 24h change on right
- Uses `useDexScreenerBatch` hook to fetch live prices from DexScreener API (`https://api.dexscreener.com/tokens/v1/solana/{addresses}`) — batches up to 30 addresses, picks highest-liquidity pair per token
- Realtime subscription on `launched_coins` table
- Skeleton loading states

### `/coin/:id` and `/token/:mintAddress` — Coin Detail
- Back link to Explore
- Top row: name + ticker left, 24h change + market cap right
- 140×140px image with 3px primary border + description headline
- Stats row: hearts (total txns), views (volume), shares (buys), copyable shortened mint address, time ago
- Summary section
- Stats card: Market Cap, Volume 24h, Liquidity, Txns 24h in 4-column grid
- Price changes row: 1h, 6h, 24h with color coding
- Buy/sell bar: green (buys) vs red (sells) proportional bar
- Embedded DexScreener chart iframe: `https://dexscreener.com/solana/{address}?embed=1&theme=dark&info=0` (400px height)
- "Read more" links: Pump.fun, Solscan, Twitter, Telegram, Website
- Token Info card: Creator, Universe, Launched date, Initial Buy
- Auto-refreshes DexScreener data every 30 seconds

### `/launch` — Launch a Brainrot Character (3-step wizard)
- Step progress bar (circles 1-2-3 connected by lines)
- **Step 1**: Character image (upload or AI generate toggle), Coin Name, Ticker (max 10 chars, auto-uppercase), Description textarea, Universe dropdown
- **Step 2**: Dev Buy Amount (SOL, number input), Twitter, Telegram, Website inputs
- **Step 3**: Review card showing image + name + ticker + description + dev buy + platform. Launch button.
- **AI image generation**: Calls `generate-character` edge function with prompt
- **Launch flow**: Builds wallet-signed auth proof (`ROT_LAUNCH:{wallet}:{nonce}:{timestamp}`), uploads image to Supabase storage bucket `character-images`, calls `launch-token` edge function
- **Auth proof**: Uses `wallet.signMessage()` to sign a message, sends base64 signature + message to backend
- Success state: Shows mint address + links to Pump.fun and Solscan
- Error state: Shows error message + "Try Again" button
- Supports prefill from character gallery via `location.state.prefill`

### `/characters` — Characters Gallery ("The Roster of Rot")
- Header with "Create" button linking to `/create-character`
- Universe filter
- Grid of character cards: avatar (image or gradient circle), name, universe, lore (2-line clamp), colored tag pills, vote buttons (thumbs up/down with counts), "Launch" button
- **Voting**: Calls `character-vote` edge function with `{ characterId, voteType, walletAddress }`. Requires connected wallet.
- Realtime subscriptions on both `characters` and `character_votes` tables

### `/create-character` — Create a Character
- Requires wallet connection (shows connect wallet UI if not connected)
- **AI Generator**: Prompt textarea (500 char max) with cycling placeholder prompts, optional inspiration/reference image upload
- **OR** direct image upload
- Generate button with cooldown (30s, fetched from backend via `action: "check"`)
- Loading state: Spinning brain icon + cycling loading messages ("Cooking your brainrot...", "Rotting the pixels...", etc.)
- Generated image preview with animated gradient border
- "Use This Character" scrolls to details form
- **Details form**: Name, Lore/Backstory, Universe selector (pill buttons), Tags (preset: cursed, wholesome rot, sigma, NPC, cooked + custom tags)
- Two submit actions: "Submit to Gallery" (inserts into `characters` table) and "Launch as Coin" (navigates to `/launch` with prefill)

### `/portfolio` — Portfolio
- Requires wallet connection
- SOL balance card, token count, Solscan link
- List of SPL token holdings with mint address + amount
- Uses `useWalletPortfolio` hook (fetches SOL balance via `connection.getBalance()`, SPL tokens via `getParsedTokenAccountsByOwner()`)
- Suppresses 403/Forbidden RPC errors silently

---

## COMPONENTS

- **Header**: Sticky, backdrop-blur, ROT logo (brightened PNG), nav links (Home, Explore, Launch, Characters, Portfolio), X/Twitter icon linking to `https://x.com/everythingisrot`, custom wallet connect button (shows shortened address when connected)
- **Footer**: Simple centered "© 2026 rot. All rights reserved."
- **TickerBar**: Marquee scrolling bar of launched coin tickers with avatars, auto-duplicated for seamless loop
- **CoinCard**: Card with avatar, name, ticker, price change badge (green/red), price/mcap/volume grid, bonding progress bar
- **CoinAvatar**: Shows image (rounded, bordered) or gradient circle with initial letter
- **BondingCurveBar**: Animated progress bar with gradient fill and glow effect
- **UniverseFilter**: Horizontally scrollable pill button filter with left/right scroll arrows

---

## SOLANA INTEGRATION

- **Wallet adapter**: Phantom + Solflare wallets on mainnet-beta
- **SolanaProvider**: Wraps app with `ConnectionProvider`, `WalletProvider` (autoConnect), `WalletModalProvider`
- **RPC**: Uses `VITE_SOLANA_RPC_URL` env var or falls back to `clusterApiUrl('mainnet-beta')`
- **Node polyfills**: `vite-plugin-node-polyfills` for buffer, process, stream, util

---

## DATABASE TABLES (Supabase/Lovable Cloud)

### `launched_coins`
id, wallet_address, name, ticker, description, image_url, universe, mint_address, signature, initial_buy, twitter, telegram, website, created_at. RLS: anyone can SELECT and INSERT, no UPDATE/DELETE.

### `token_launches`
id, user_wallet, token_name, token_symbol, token_description, token_image_url, sol_amount (default 0.02), status (default 'pending'), universe, mint_address, transaction_signature, payment_signature, twitter, telegram, website, created_at. RLS: anyone can SELECT/INSERT, service can UPDATE, no DELETE.

### `characters`
id, wallet_address, name, lore, image_url, universe (default 'Italian Brainrot'), tags (text[]), upvotes (default 0), downvotes (default 0), created_at. RLS: anyone can SELECT/INSERT, no UPDATE (blocked, `USING (false)`), no DELETE.

### `character_votes`
id, character_id, wallet_address, vote_type, created_at. RLS: anyone can SELECT/INSERT, no UPDATE or DELETE (both blocked with `false`).

### `ai_generations`
id, wallet_address, generation_count (default 0), last_generated_at, created_at, updated_at. RLS: anyone can SELECT, service can INSERT/UPDATE, no DELETE.

### `videos`
id, title, description, video_url, thumbnail_url, wallet_address, universe, tags, likes_count, comments_count, created_at. RLS: anyone can SELECT/INSERT/UPDATE (own), no DELETE.

### `video_comments`
id, video_id (FK→videos), content, wallet_address, created_at. RLS: anyone can SELECT/INSERT, no UPDATE/DELETE.

### `video_likes`
id, video_id (FK→videos), wallet_address, created_at. RLS: anyone can SELECT/INSERT/DELETE, no UPDATE.

**Storage buckets**: `character-images` (public), `videos` (public).

**Realtime**: Enable realtime on `launched_coins`, `characters`, `character_votes`.

---

## EDGE FUNCTIONS

### `generate-character` (verify_jwt=false)
- Accepts `{ prompt, walletAddress, action }`.
- `action: "check"`: Returns generation count + cooldown remaining for a wallet.
- `action: "generate"` (default): Validates wallet (base58 regex), IP-based rate limiting (30s cooldown per IP), wallet-based cooldown (30s), prompt validation (max 500 chars).
- Calls OpenAI `gpt-image-1` model with brainrot-style system prompt, returns base64 or URL.
- Tracks generations in `ai_generations` table.
- **Requires secret**: `OPENAI_API_KEY`.

### `launch-token` (verify_jwt=false)
- Accepts `{ userWallet, launchAuthMessage, launchAuthSignature, tokenName, tokenSymbol, tokenDescription, tokenImageUrl, devBuyAmount, universe, twitter, telegram, website }`.
- **Signature verification**: Validates `ROT_LAUNCH:{wallet}:{nonce}:{timestamp}` format, checks timestamp skew (5 min max), verifies ed25519 signature using `tweetnacl`.
- **Input validation**: tokenName max 50 chars, tokenSymbol max 10 chars, wallet base58 format, devBuyAmount capped at 5 SOL.
- **Rate limiting**: Max 3 launches/hour, 10 launches/day per wallet.
- Creates pending record in `token_launches`.
- Fetches token image → uploads to Pump.fun IPFS (`https://pump.fun/api/ipfs`).
- Generates mint keypair, calls PumpPortal trade API (`https://pumpportal.fun/api/trade-local`) with create action.
- Signs transaction with both mint keypair and proxy wallet keypair, sends via Solana RPC.
- On success: updates `token_launches` status to "completed", inserts into `launched_coins`.
- **Requires secrets**: `PROXY_WALLET_PRIVATE_KEY`, `SOLANA_RPC_URL`.

### `character-vote` (verify_jwt=false)
- Accepts `{ characterId, voteType, walletAddress }`.
- Handles vote insert/toggle logic via `character_votes` table.

### `pump-proxy` (verify_jwt=false)
- Proxy for Pump.fun API calls.

### `solana-relay` (verify_jwt=false)
- Relay for Solana RPC calls.

---

## BRAINROT UNIVERSES

```
Italian Brainrot, Russian Brainrot, Chinese Brainrot, Turkish Brainrot, Arabic Brainrot, Japanese Brainrot, Indian Brainrot, American Brainrot, Korean Brainrot, Brazilian Brainrot
```

---

## KEY DEPENDENCIES

React 18, react-router-dom, @tanstack/react-query, framer-motion, @solana/web3.js v1.x, @solana/wallet-adapter-react + wallets (Phantom, Solflare), @solana/spl-token, @supabase/supabase-js, lucide-react, shadcn/ui components, recharts, sonner, tailwindcss-animate, vite-plugin-node-polyfills.

---

## SECRETS NEEDED

- `OPENAI_API_KEY` — For AI character generation
- `PROXY_WALLET_PRIVATE_KEY` — Server-side Solana keypair for signing token launches
- `SOLANA_RPC_URL` — Solana mainnet RPC endpoint
