-- Replace hard false policies with service-role-only policies.
-- This keeps client access blocked while avoiding fully-impossible policy expressions.

-- ai_generations
DROP POLICY IF EXISTS "No direct generation reads" ON public.ai_generations;
CREATE POLICY "Service role generation reads"
ON public.ai_generations
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct generation inserts" ON public.ai_generations;
CREATE POLICY "Service role generation inserts"
ON public.ai_generations
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct generation updates" ON public.ai_generations;
CREATE POLICY "Service role generation updates"
ON public.ai_generations
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- character_votes
DROP POLICY IF EXISTS "No direct vote reads" ON public.character_votes;
CREATE POLICY "Service role vote reads"
ON public.character_votes
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct vote inserts" ON public.character_votes;
CREATE POLICY "Service role vote inserts"
ON public.character_votes
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct vote updates" ON public.character_votes;
CREATE POLICY "Service role vote updates"
ON public.character_votes
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct vote deletes" ON public.character_votes;
CREATE POLICY "Service role vote deletes"
ON public.character_votes
FOR DELETE
USING (auth.role() = 'service_role');

-- token_launches
DROP POLICY IF EXISTS "No direct token launch reads" ON public.token_launches;
CREATE POLICY "Service role token launch reads"
ON public.token_launches
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct token launch inserts" ON public.token_launches;
CREATE POLICY "Service role token launch inserts"
ON public.token_launches
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct token launch updates" ON public.token_launches;
CREATE POLICY "Service role token launch updates"
ON public.token_launches
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- characters
DROP POLICY IF EXISTS "No direct character reads" ON public.characters;
CREATE POLICY "Service role character reads"
ON public.characters
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No anonymous updates on characters" ON public.characters;
CREATE POLICY "Service role character updates"
ON public.characters
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- launched_coins
DROP POLICY IF EXISTS "No direct launched coin reads" ON public.launched_coins;
CREATE POLICY "Service role launched coin reads"
ON public.launched_coins
FOR SELECT
USING (auth.role() = 'service_role');

-- videos
DROP POLICY IF EXISTS "No direct video reads" ON public.videos;
CREATE POLICY "Service role video reads"
ON public.videos
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct video updates" ON public.videos;
CREATE POLICY "Service role video updates"
ON public.videos
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can insert videos" ON public.videos;
CREATE POLICY "Service role video inserts"
ON public.videos
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- video_likes
DROP POLICY IF EXISTS "No direct video like reads" ON public.video_likes;
CREATE POLICY "Service role video like reads"
ON public.video_likes
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "No direct video like deletes" ON public.video_likes;
CREATE POLICY "Service role video like deletes"
ON public.video_likes
FOR DELETE
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can insert likes" ON public.video_likes;
CREATE POLICY "Service role video like inserts"
ON public.video_likes
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- video_comments
DROP POLICY IF EXISTS "No direct video comment reads" ON public.video_comments;
CREATE POLICY "Service role video comment reads"
ON public.video_comments
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can insert comments" ON public.video_comments;
CREATE POLICY "Service role video comment inserts"
ON public.video_comments
FOR INSERT
WITH CHECK (auth.role() = 'service_role');