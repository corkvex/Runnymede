import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllVideos, getProfile, type StoredVideo, type StoredProfile } from '@/lib/storage';
import VideoCard from '@/components/VideoCard';
import { Video, Loader2 } from 'lucide-react';

export default function Videos() {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [uploaders, setUploaders] = useState<Record<string, StoredProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const all = await getAllVideos();
      const filtered = all.filter((v) => v.contentType === 'video').sort((a, b) => b.createdAt - a.createdAt);
      setVideos(filtered);
      const uploaderMap: Record<string, StoredProfile> = {};
      for (const v of filtered) {
        if (!uploaderMap[v.userId]) {
          const p = await getProfile(v.userId);
          if (p) uploaderMap[v.userId] = p;
        }
      }
      setUploaders(uploaderMap);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Video size={28} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-theme-text">Videos</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-theme-text-3" /></div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Video size={48} className="text-theme-border mb-4" />
          <p className="text-theme-text-3 text-lg">No videos yet</p>
          <Link to="/upload" className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium">Upload the first one</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((v) => <VideoCard key={v.id} video={v} uploader={uploaders[v.userId]} />)}
        </div>
      )}
    </div>
  );
}
