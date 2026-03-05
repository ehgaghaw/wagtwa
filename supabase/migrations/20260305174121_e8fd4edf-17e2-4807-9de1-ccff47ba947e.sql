
-- Create table to track AI character generations per wallet
CREATE TABLE public.ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  generation_count INTEGER NOT NULL DEFAULT 0,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- Allow edge function (service role) to read/write, and anyone to read their own row
CREATE POLICY "Anyone can read generation counts"
  ON public.ai_generations FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert generation records"
  ON public.ai_generations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update generation records"
  ON public.ai_generations FOR UPDATE
  USING (true);

-- Create index on wallet_address for fast lookups
CREATE INDEX idx_ai_generations_wallet ON public.ai_generations (wallet_address);
