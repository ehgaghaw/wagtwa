CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  wallet_address text NOT NULL,
  name text NOT NULL,
  lore text,
  tags text[] DEFAULT '{}',
  image_url text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read characters" ON public.characters FOR SELECT USING (true);
CREATE POLICY "Anyone can insert characters" ON public.characters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own characters" ON public.characters FOR UPDATE USING (true);