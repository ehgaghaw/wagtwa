
-- Videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  wallet_address TEXT NOT NULL,
  universe TEXT NOT NULL DEFAULT 'Italian Brainrot',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (video_id, wallet_address)
);

-- Video comments table
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Videos: anyone can read
CREATE POLICY "Anyone can read videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert videos" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own videos" ON public.videos FOR UPDATE USING (true);

-- Likes: anyone can read, insert, delete
CREATE POLICY "Anyone can read likes" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert likes" ON public.video_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete own likes" ON public.video_likes FOR DELETE USING (true);

-- Comments: anyone can read and insert
CREATE POLICY "Anyone can read comments" ON public.video_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON public.video_comments FOR INSERT WITH CHECK (true);

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Storage policies
CREATE POLICY "Anyone can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Anyone can read videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;
