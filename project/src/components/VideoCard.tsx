import { Link } from 'react-router-dom';
import type { StoredVideo, StoredProfile } from '@/lib/storage';
import { Play, Eye } from 'lucide-react';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatViews(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface VideoCardProps {
  video: StoredVideo;
  uploader?: StoredProfile;
}

export default function VideoCard({ video, uploader }: VideoCardProps) {
  return (
    <Link to={`/watch/${video.id}`} className="group">
      <div className="aspect-video rounded-xl overflow-hidden bg-theme-elevated relative">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-theme-elevated to-theme-surface">
            <Play size={32} className="text-theme-text-3 opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <div className="flex gap-3 mt-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {(uploader?.handle || '?').substring(1, 3).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-theme-text line-clamp-2 group-hover:text-amber-400 transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-theme-text-3 mt-1">
            {uploader?.handle || 'Unknown'}
          </p>
          <p className="text-xs text-theme-text-3">
            {formatViews(video.views)} views · {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
