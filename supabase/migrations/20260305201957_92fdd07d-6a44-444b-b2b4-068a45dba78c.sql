CREATE TABLE public.launched_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  name text NOT NULL,
  ticker text NOT NULL,
  description text DEFAULT '',
  image_url text,
  universe text NOT NULL DEFAULT 'Italian Brainrot',
  mint_address text,
  signature text,
  twitter text,
  telegram text,
  website text,
  initial_buy numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.launched_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read launched coins" ON public.launched_coins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert launched coins" ON public.launched_coins FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.launched_coins;