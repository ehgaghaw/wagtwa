
-- Character votes table for realtime voting
CREATE TABLE public.character_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (character_id, wallet_address)
);

ALTER TABLE public.character_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes" ON public.character_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.character_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON public.character_votes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete votes" ON public.character_votes FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_votes;
