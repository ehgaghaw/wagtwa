
-- Drop existing overly permissive upload policies
DROP POLICY IF EXISTS "Anyone can upload to character-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;

-- Re-create with MIME type restrictions
CREATE POLICY "Upload images only to character-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'character-images'
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp'))
  );

CREATE POLICY "Upload videos only to videos bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.extension(name) IN ('mp4', 'webm', 'mov'))
  );
