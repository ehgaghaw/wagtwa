import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Rocket, Play, Pause, Upload, X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { BRAINROT_UNIVERSES, type BrainrotUniverse } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  wallet_address: string;
  universe: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  wallet_address: string;
  content: string;
  created_at: string;
}

// ─── Video Player Card ───
const VideoCard = ({
  video,
  isActive,
  walletAddress,
  likedVideos,
  onToggleLike,
  onOpenComments,
}: {
  video: Video;
  isActive: boolean;
  walletAddress: string | null;
  likedVideos: Set<string>;
  onToggleLike: (videoId: string) => void;
  onOpenComments: (videoId: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      setPaused(false);
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  };

  const shortWallet = video.wallet_address
    ? `${video.wallet_address.slice(0, 4)}...${video.wallet_address.slice(-4)}`
    : 'anon';

  const isLiked = likedVideos.has(video.id);

  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden snap-start snap-always">
      <video
        ref={videoRef}
        src={video.video_url}
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
      />
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="h-16 w-16 text-foreground/60" />
        </div>
      )}

      {/* Bottom left overlay */}
      <div className="absolute bottom-4 left-4 right-16 z-10">
        <p className="text-xs text-muted-foreground font-mono-num mb-1">{shortWallet}</p>
        <p className="text-sm font-semibold text-foreground mb-1 line-clamp-2">{video.title}</p>
        {video.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {video.tags.map(t => (
              <span key={t} className="text-xs text-primary">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="absolute bottom-4 right-3 flex flex-col items-center gap-5 z-10">
        <button
          onClick={() => onToggleLike(video.id)}
          className="flex flex-col items-center gap-1"
        >
          <Heart className={`h-6 w-6 ${isLiked ? 'fill-primary text-primary' : 'text-foreground'}`} />
          <span className="text-xs font-mono-num text-foreground">{video.likes_count}</span>
        </button>
        <button
          onClick={() => onOpenComments(video.id)}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="h-6 w-6 text-foreground" />
          <span className="text-xs font-mono-num text-foreground">{video.comments_count}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Share2 className="h-6 w-6 text-foreground" />
          <span className="text-xs text-foreground">Share</span>
        </button>
        <Link
          to={`/launch?name=${encodeURIComponent(video.title)}`}
          className="flex flex-col items-center gap-1"
        >
          <Rocket className="h-6 w-6 text-primary" />
          <span className="text-xs text-primary">Coin</span>
        </Link>
      </div>
    </div>
  );
};

// ─── Comments Panel ───
const CommentsPanel = ({
  videoId,
  onClose,
  walletAddress,
}: {
  videoId: string;
  onClose: () => void;
  walletAddress: string | null;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('video_comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setComments(data);
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel(`comments-${videoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'video_comments', filter: `video_id=eq.${videoId}` }, () => {
        fetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [videoId, fetchComments]);

  const postComment = async () => {
    if (!walletAddress) {
      toast({ title: 'Connect your wallet to comment', variant: 'destructive' });
      return;
    }
    if (!newComment.trim()) return;
    await supabase.from('video_comments').insert({ video_id: videoId, wallet_address: walletAddress, content: newComment.trim() });
    await supabase.from('videos').update({ comments_count: comments.length + 1 }).eq('id', videoId);
    setNewComment('');
    fetchComments();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-card border-t border-border rounded-t-xl z-20 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Comments</span>
        <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No comments yet</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="text-xs">
              <span className="text-primary font-mono-num">{c.wallet_address.slice(0, 4)}...{c.wallet_address.slice(-4)}</span>
              <p className="text-foreground mt-0.5">{c.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2 px-4 py-3 border-t border-border">
        <Input
          placeholder={walletAddress ? 'Add a comment...' : 'Connect wallet to comment'}
          className="bg-muted border-border text-xs h-8 flex-1"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && postComment()}
          disabled={!walletAddress}
        />
        <Button size="sm" className="bg-primary text-primary-foreground h-8 px-3" onClick={postComment} disabled={!walletAddress}>
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// ─── Upload Modal ───
const UploadModal = ({
  onClose,
  walletAddress,
  onUploaded,
}: {
  onClose: () => void;
  walletAddress: string | null;
  onUploaded: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [universe, setUniverse] = useState<BrainrotUniverse>('Italian Brainrot');
  const [tagsStr, setTagsStr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!walletAddress) {
      toast({ title: 'Connect your wallet first', variant: 'destructive' });
      return;
    }
    if (!file || !title.trim()) {
      toast({ title: 'Title and video file are required', variant: 'destructive' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File too large (max 50MB)', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('videos').upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      const { error: insertErr } = await supabase.from('videos').insert({
        title: title.trim(),
        description: description.trim(),
        video_url: urlData.publicUrl,
        wallet_address: walletAddress,
        universe,
        tags,
      });
      if (insertErr) throw insertErr;

      toast({ title: 'Video posted!' });
      onUploaded();
      onClose();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Upload Video</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        {!walletAddress ? (
          <p className="text-xs text-destructive">Connect your wallet to upload videos.</p>
        ) : (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Video File (MP4, max 50MB)</label>
              <input ref={fileRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-border rounded-md p-6 text-center bg-muted/30 hover:border-muted-foreground/50 transition-colors"
              >
                {file ? (
                  <p className="text-xs text-foreground">{file.name}</p>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Click to select video</p>
                  </>
                )}
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title</label>
              <Input className="bg-muted border-border text-sm h-9" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Description</label>
              <Textarea className="bg-muted border-border text-sm" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Brainrot Universe</label>
              <select
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
                value={universe}
                onChange={e => setUniverse(e.target.value as BrainrotUniverse)}
              >
                {BRAINROT_UNIVERSES.filter(u => u !== 'All').map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tags (comma separated)</label>
              <Input className="bg-muted border-border text-sm h-9" placeholder="funny, viral, brainrot" value={tagsStr} onChange={e => setTagsStr(e.target.value)} />
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground font-semibold h-9"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : 'Post'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Videos Page ───
const FEED_FILTERS = ['For You', 'Trending', ...BRAINROT_UNIVERSES.filter(u => u !== 'All')] as const;

const Videos = () => {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() || null;

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [feedFilter, setFeedFilter] = useState<string>('For You');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchVideos = useCallback(async () => {
    let query = supabase.from('videos').select('*');

    const universeFilters = BRAINROT_UNIVERSES.filter(u => u !== 'All');
    if (feedFilter === 'Trending') {
      query = query.order('likes_count', { ascending: false });
    } else if (universeFilters.includes(feedFilter as any)) {
      query = query.eq('universe', feedFilter).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data } = await query.limit(50);
    if (data) setVideos(data as Video[]);
    setLoading(false);
  }, [feedFilter]);

  const fetchLikes = useCallback(async () => {
    if (!walletAddress) return;
    const { data } = await supabase.from('video_likes').select('video_id').eq('wallet_address', walletAddress);
    if (data) setLikedVideos(new Set(data.map(d => d.video_id)));
  }, [walletAddress]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  const toggleLike = async (videoId: string) => {
    if (!walletAddress) {
      toast({ title: 'Connect your wallet to like', variant: 'destructive' });
      return;
    }
    const isLiked = likedVideos.has(videoId);
    if (isLiked) {
      await supabase.from('video_likes').delete().eq('video_id', videoId).eq('wallet_address', walletAddress);
      setLikedVideos(prev => { const s = new Set(prev); s.delete(videoId); return s; });
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likes_count: Math.max(0, v.likes_count - 1) } : v));
    } else {
      await supabase.from('video_likes').insert({ video_id: videoId, wallet_address: walletAddress });
      setLikedVideos(prev => new Set(prev).add(videoId));
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likes_count: v.likes_count + 1 } : v));
    }
    // Update count in DB
    const vid = videos.find(v => v.id === videoId);
    if (vid) {
      const newCount = isLiked ? Math.max(0, vid.likes_count - 1) : vid.likes_count + 1;
      await supabase.from('videos').update({ likes_count: newCount }).eq('id', videoId);
    }
  };

  // Intersection observer for auto-play
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    container.querySelectorAll('[data-index]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [videos]);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Top bar with filters + upload */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-1.5 flex-nowrap">
          {FEED_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setFeedFilter(f); setLoading(true); }}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                feedFilter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto shrink-0">
          <Button size="sm" className="bg-primary text-primary-foreground h-7 text-xs font-semibold" onClick={() => setShowUpload(true)}>
            <Upload className="h-3 w-3 mr-1" /> Upload
          </Button>
        </div>
      </div>

      {/* Video Feed */}
      <div className="flex-1 flex items-center justify-center bg-background overflow-hidden">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : videos.length === 0 ? (
          <div className="text-center">
            <p className="font-display text-lg font-bold text-foreground mb-1">ROT</p>
            <p className="text-sm text-muted-foreground mb-3">sit back and rot 🧠🪱</p>
            <Button size="sm" className="bg-primary text-primary-foreground text-xs" onClick={() => setShowUpload(true)}>
              <Upload className="h-3 w-3 mr-1" /> Be the first to upload
            </Button>
          </div>
        ) : (
          <div className="relative w-full max-w-[400px] h-full max-h-[700px]">
            <div
              ref={scrollRef}
              className="h-full overflow-y-scroll snap-y snap-mandatory rounded-lg"
              style={{ scrollbarWidth: 'none' }}
            >
              {videos.map((video, i) => (
                <div key={video.id} data-index={i} className="h-full w-full snap-start snap-always">
                  <VideoCard
                    video={video}
                    isActive={i === activeIndex}
                    walletAddress={walletAddress}
                    likedVideos={likedVideos}
                    onToggleLike={toggleLike}
                    onOpenComments={setCommentsVideoId}
                  />
                </div>
              ))}
            </div>

            {/* Comments Panel */}
            {commentsVideoId && (
              <CommentsPanel
                videoId={commentsVideoId}
                onClose={() => setCommentsVideoId(null)}
                walletAddress={walletAddress}
              />
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          walletAddress={walletAddress}
          onUploaded={fetchVideos}
        />
      )}
    </div>
  );
};

export default Videos;
