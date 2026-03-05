-- Create storage bucket for character images
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-images', 'character-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to character-images bucket
CREATE POLICY "Anyone can upload character images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'character-images');

-- Allow anyone to read character images
CREATE POLICY "Anyone can read character images"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-images');