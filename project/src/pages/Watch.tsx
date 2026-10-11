import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVideo, getProfile, incrementVideoViews, isLiked, getLikeCount, saveLike, removeLike, type StoredVideo, type StoredProfile } from '@/lib/storage';
import { useIdentity } from '@/context/IdentityContext';
import { ArrowLeft, ThumbsUp, Eye, Zap } from 'lucide-react';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const { identity } = useIdentity();
  const [video, setVideo] = useState<StoredVideo | null>(null);
  const [uploader, setUploader] = useState<StoredProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const v = await getVideo(id);
      if (!v) { setLoading(false); return; }
      setVideo(v);
      const u = await getProfile(v.userId);
      setUploader(u || null);
      await incrementVideoViews(id);
      setVideo({ ...v, views: v.views + 1 });
      if (identity) {
        setLiked(await isLiked(identity.fullId, id));
      }
      setLikeCount(await getLikeCount(id));
      setLoading(false);
    };
    fetch();
  }, [id, identity]);

  const handleLike = async () => {
    if (!identity || !id) return;
    if (liked) {
      await removeLike(identity.fullId, id);
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      await saveLike({ id: `${identity.fullId}-${id}-${Date.now()}`, userId: identity.fullId, videoId: id, createdAt: Date.now() });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" /></div>;

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-theme-text-3 text-lg">Video not found</p>
        <Link to="/videos" className="text-amber-400 hover:text-amber-300 mt-2">Back to videos</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <button onClick={() => window.history.back()} className="flex items-center gap-1 text-xs text-theme-text-3 hover:text-theme-text mb-3">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="aspect-video rounded-xl overflow-hidden bg-black">
        <video src={video.videoUrl} controls autoPlay className="w-full h-full" poster={video.thumbnailUrl || undefined} />
      </div>

      <h1 className="text-lg md:text-xl font-bold text-theme-text mt-4">{video.title}</h1>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
        <Link to={`/profile/${video.userId}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
            {(uploader?.handle || '?').substring(1, 3).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-mono text-theme-text group-hover:text-amber-400 transition-colors">{uploader?.handle || 'Unknown'}</p>
            <p className="text-xs text-theme-text-3">{uploader?.elo || 0} Elo</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button onClick={handleLike} disabled={!identity} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${liked ? 'bg-amber-600/20 text-amber-400' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'}`}>
            <ThumbsUp size={16} /> {likeCount}
          </button>
          <span className="flex items-center gap-1.5 text-xs text-theme-text-3"><Eye size={14} /> {video.views} views</span>
        </div>
      </div>

      <div className="mt-4 bg-theme-surface border border-theme-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          {video.contentType === 'short' && <Zap size={14} className="text-amber-400" />}
          <span className="text-xs text-theme-text-3">{video.category}</span>
          <span className="text-xs text-theme-text-3">· {new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
        {video.description && <p className="text-sm text-theme-text-2 whitespace-pre-wrap">{video.description}</p>}
      </div>
    </div>
  );
}
