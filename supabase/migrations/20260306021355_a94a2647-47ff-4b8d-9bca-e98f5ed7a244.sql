-- Tighten character_votes write access to prevent direct client-side tampering
DROP POLICY IF EXISTS "Anyone can update votes" ON public.character_votes;
DROP POLICY IF EXISTS "Anyone can delete votes" ON public.character_votes;

CREATE POLICY "No direct vote updates"
ON public.character_votes
FOR UPDATE
TO public
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct vote deletes"
ON public.character_votes
FOR DELETE
TO public
USING (false);