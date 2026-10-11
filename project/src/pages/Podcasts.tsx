import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVideosByType, getProfile, type StoredVideo, type StoredProfile } from '@/lib/storage';
import VideoCard from '@/components/VideoCard';
import { Mic, Loader2 } from 'lucide-react';

export default function Podcasts() {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [uploaders, setUploaders] = useState<Record<string, StoredProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const pods = await getVideosByType('podcast');
      setVideos(pods.sort((a, b) => b.createdAt - a.createdAt));
      const map: Record<string, StoredProfile> = {};
      for (const v of pods) {
        if (!map[v.userId]) {
          const p = await getProfile(v.userId);
          if (p) map[v.userId] = p;
        }
      }
      setUploaders(map);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mic size={28} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-theme-text">Podcasts</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-theme-text-3" /></div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Mic size={48} className="text-theme-border mb-4" />
          <p className="text-theme-text-3 text-lg">No podcasts yet</p>
          <Link to="/upload" className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium">Upload the first podcast</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((v) => <VideoCard key={v.id} video={v} uploader={uploaders[v.userId]} />)}
        </div>
      )}
    </div>
  );
}
