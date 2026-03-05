
CREATE TABLE public.token_launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_description TEXT,
  token_image_url TEXT,
  mint_address TEXT,
  transaction_signature TEXT,
  payment_signature TEXT,
  sol_amount NUMERIC NOT NULL DEFAULT 0.02,
  status TEXT NOT NULL DEFAULT 'pending',
  universe TEXT NOT NULL DEFAULT 'Italian Brainrot',
  twitter TEXT,
  telegram TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.token_launches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token launches" ON public.token_launches FOR SELECT USING (true);
CREATE POLICY "Anyone can insert token launches" ON public.token_launches FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update token launches" ON public.token_launches FOR UPDATE USING (true);
