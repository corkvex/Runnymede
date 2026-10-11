import { useEffect, useState } from 'react';
import { detectGeo, isTopicRestricted, getRestrictedTopics, type GeoInfo } from '@/lib/geofence';
import { Globe, AlertTriangle, ShieldOff } from 'lucide-react';

interface GeofenceNoticeProps {
  topic?: string;
  onBlocked?: (blocked: boolean) => void;
}

export default function GeofenceNotice({ topic, onBlocked }: GeofenceNoticeProps) {
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    detectGeo().then((info) => {
      setGeo(info);
      if (topic) {
        const isBlocked = isTopicRestricted(topic, info.countryCode);
        setBlocked(isBlocked);
        onBlocked?.(isBlocked);
      }
    });
  }, [topic, onBlocked]);

  if (blocked) {
    return (
      <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-6 text-center">
        <ShieldOff size={32} className="text-red-400 mx-auto mb-3" />
        <h3 className="text-red-300 font-semibold">Content Geofenced</h3>
        <p className="text-red-400/70 text-sm mt-1">
          This debate topic is restricted in your jurisdiction ({geo?.countryCode}).
          It has been automatically blocked to comply with local laws.
        </p>
      </div>
    );
  }

  if (!geo?.countryCode) return null;

  const restricted = getRestrictedTopics(geo.countryCode);
  if (restricted.length === 0) return null;

  return (
    <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-amber-400/80">
      <Globe size={14} />
      <span>Geofence active for {geo.countryCode} — {restricted.length} restricted topics filtered</span>
    </div>
  );
}

export function ReportThreshold({ flagCount, threshold, onPause }: { flagCount: number; threshold: number; onPause: () => void }) {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (flagCount >= threshold && !triggered) {
      setTriggered(true);
      onPause();
    }
  }, [flagCount, threshold, triggered, onPause]);

  if (!triggered) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4">
      <div className="w-full max-w-md bg-theme-surface border border-red-800/50 rounded-2xl p-6 text-center">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-theme-text">Automated Pause Triggered</h2>
        <p className="text-sm text-theme-text-2 mt-2">
          This stream has received {flagCount} reports for potentially illegal content.
          The debate has been paused pending cryptographic confirmation from participants.
        </p>
        <p className="text-xs text-theme-text-3 mt-4">
          Flag threshold: {threshold} reports in a rolling window.
        </p>
      </div>
    </div>
  );
}
