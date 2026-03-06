-- Harden direct client access to sensitive tables.
-- Edge functions using service-role keys remain unaffected.

-- ai_generations: no direct client reads/writes
DROP POLICY IF EXISTS "Anyone can read generation counts" ON public.ai_generations;
CREATE POLICY "No direct generation reads"
ON public.ai_generations
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Service role can insert generation records" ON public.ai_generations;
CREATE POLICY "No direct generation inserts"
ON public.ai_generations
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Service role can update generation records" ON public.ai_generations;
CREATE POLICY "No direct generation updates"
ON public.ai_generations
FOR UPDATE
USING (false)
WITH CHECK (false);

-- character_votes: require edge function for reads/writes
DROP POLICY IF EXISTS "Anyone can read votes" ON public.character_votes;
CREATE POLICY "No direct vote reads"
ON public.character_votes
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Anyone can insert votes" ON public.character_votes;
CREATE POLICY "No direct vote inserts"
ON public.character_votes
FOR INSERT
WITH CHECK (false);

-- token_launches: no direct client reads/writes
DROP POLICY IF EXISTS "Anyone can read token launches" ON public.token_launches;
CREATE POLICY "No direct token launch reads"
ON public.token_launches
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Anyone can insert token launches" ON public.token_launches;
CREATE POLICY "No direct token launch inserts"
ON public.token_launches
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Service can update token launches" ON public.token_launches;
CREATE POLICY "No direct token launch updates"
ON public.token_launches
FOR UPDATE
USING (false)
WITH CHECK (false);