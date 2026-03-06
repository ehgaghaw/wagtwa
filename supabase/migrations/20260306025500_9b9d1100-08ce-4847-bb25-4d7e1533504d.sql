-- Remove public read exposure of wallet-linked tables.
-- Reads are served through backend functions instead.

DROP POLICY IF EXISTS "Anyone can read characters" ON public.characters;
CREATE POLICY "No direct character reads"
ON public.characters
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Anyone can read launched coins" ON public.launched_coins;
CREATE POLICY "No direct launched coin reads"
ON public.launched_coins
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Anyone can read comments" ON public.video_comments;
CREATE POLICY "No direct video comment reads"
ON public.video_comments
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Anyone can read likes" ON public.video_likes;
CREATE POLICY "No direct video like reads"
ON public.video_likes
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "Anyone can read videos" ON public.videos;
CREATE POLICY "No direct video reads"
ON public.videos
FOR SELECT
USING (false);

-- Prevent broad row mutation paths flagged by scanner.
DROP POLICY IF EXISTS "Anyone can update own videos" ON public.videos;
CREATE POLICY "No direct video updates"
ON public.videos
FOR UPDATE
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Anyone can delete own likes" ON public.video_likes;
CREATE POLICY "No direct video like deletes"
ON public.video_likes
FOR DELETE
USING (false);