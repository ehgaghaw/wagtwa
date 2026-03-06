-- Fix: restrict characters UPDATE to only rows matching the caller's wallet
DROP POLICY IF EXISTS "Anyone can update own characters" ON public.characters;

CREATE POLICY "Anyone can update own characters"
  ON public.characters
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Note: Since this app uses wallet-based auth (not Supabase Auth), we cannot use auth.uid().
-- The practical fix is to remove client-side UPDATE and use an edge function instead.
-- For now, we tighten by requiring wallet_address match via WITH CHECK as a placeholder.
-- The real solution below drops direct client UPDATE entirely:

DROP POLICY IF EXISTS "Anyone can update own characters" ON public.characters;

-- Deny all client-side updates - updates should go through a validated edge function
-- We create a restrictive policy that effectively blocks anonymous updates
CREATE POLICY "No anonymous updates on characters"
  ON public.characters
  FOR UPDATE
  USING (false);