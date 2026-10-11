import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '@/context/IdentityContext';
import { getVideosByUser, getLikedVideos, getProfile, type StoredVideo, type StoredProfile } from '@/lib/storage';
import VideoCard from '@/components/VideoCard';
import { Library, ThumbsUp, Clock, Loader2, Upload } from 'lucide-react';

export default function LibraryPage() {
  const { identity } = useIdentity();
  const [myVideos, setMyVideos] = useState<StoredVideo[]>([]);
  const [likedVideos, setLikedVideos] = useState<StoredVideo[]>([]);
  const [uploaders, setUploaders] = useState<Record<string, StoredProfile>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mine' | 'liked'>('mine');

  useEffect(() => {
    if (!identity) { setLoading(false); return; }
    const fetch = async () => {
      const [mine, liked] = await Promise.all([
        getVideosByUser(identity.fullId),
        getLikedVideos(identity.fullId),
      ]);
      setMyVideos(mine.sort((a, b) => b.createdAt - a.createdAt));
      setLikedVideos(liked.sort((a, b) => b.createdAt - a.createdAt));
      const all = [...mine, ...liked];
      const map: Record<string, StoredProfile> = {};
      for (const v of all) {
        if (!map[v.userId]) {
          const p = await getProfile(v.userId);
          if (p) map[v.userId] = p;
        }
      }
      setUploaders(map);
      setLoading(false);
    };
    fetch();
  }, [identity]);

  const tabClass = (active: boolean) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-amber-600 text-white' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'}`;
  const videos = tab === 'mine' ? myVideos : likedVideos;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Library size={28} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-theme-text">Library</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('mine')} className={tabClass(tab === 'mine')}><Clock size={16} /> My Videos</button>
        <button onClick={() => setTab('liked')} className={tabClass(tab === 'liked')}><ThumbsUp size={16} /> Liked</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-theme-text-3" /></div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {tab === 'mine' ? (
            <>
              <Upload size={48} className="text-theme-border mb-4" />
              <p className="text-theme-text-3 text-lg">No uploads yet</p>
              <Link to="/upload" className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium">Upload your first video</Link>
            </>
          ) : (
            <>
              <ThumbsUp size={48} className="text-theme-border mb-4" />
              <p className="text-theme-text-3 text-lg">No liked videos</p>
              <p className="text-theme-text-3 text-sm mt-2">Videos you like will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((v) => <VideoCard key={v.id} video={v} uploader={uploaders[v.userId]} />)}
        </div>
      )}
    </div>
  );
}
