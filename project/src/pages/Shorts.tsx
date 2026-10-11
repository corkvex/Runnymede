import { useEffect, useState, useRef } from 'react';
import { getAllDebates, type StoredDebate } from '@/lib/storage';
import { getRankFromElo } from '@/lib/elo';
import { Link } from 'react-router-dom';
import { Zap, ChevronUp, ChevronDown, Mic } from 'lucide-react';

export default function Shorts() {
  const [debates, setDebates] = useState<StoredDebate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const all = await getAllDebates();
      // Use ended debates with winners as "clips" — most engaging
      const clips = all.filter((d) => d.status === 'ended' && d.winnerId).sort((a, b) => (b.proVotes + b.conVotes) - (a.proVotes + a.conVotes));
      setDebates(clips);
      setLoading(false);
    };
    fetch();
  }, []);

  const next = () => setIndex((i) => Math.min(i + 1, debates.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  if (debates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Zap size={48} className="text-theme-border mb-4" />
        <p className="text-theme-text-3 text-lg">No debate clips yet</p>
        <p className="text-theme-text-3 text-sm mt-2">Completed debates will appear here as clips.</p>
      </div>
    );
  }

  const d = debates[index];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] relative">
      <div className="relative w-full max-w-[420px] flex flex-col h-full">
        <div className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-theme-surface via-amber-950/20 to-theme-surface border border-theme-border mx-2 flex flex-col items-center justify-center p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-amber-400" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wide">Debate Clip</span>
          </div>
          <Link to={`/arena/${d.id}`} className="text-center">
            <h2 className="text-lg font-bold text-theme-text mb-2">{d.title}</h2>
            <p className="text-sm text-theme-text-2 italic mb-4">"{d.topic}"</p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">PRO</div>
                <span className="text-xs text-green-400 mt-1">{d.proVotes} votes</span>
              </div>
              <span className="text-theme-text-3 text-xl font-bold">VS</span>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm">CON</div>
                <span className="text-xs text-red-400 mt-1">{d.conVotes} votes</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-400 justify-center">
              <Mic size={12} /> {d.proVotes + d.conVotes} audience votes
            </div>
            <p className="text-xs text-theme-text-3 mt-3">Tap to watch full debate</p>
          </Link>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 -mr-1">
          <button onClick={prev} disabled={index === 0} className="w-10 h-10 rounded-full bg-theme-elevated hover:bg-theme-hover disabled:opacity-30 flex items-center justify-center text-theme-text transition-colors"><ChevronUp size={22} /></button>
          <button onClick={next} disabled={index >= debates.length - 1} className="w-10 h-10 rounded-full bg-theme-elevated hover:bg-theme-hover disabled:opacity-30 flex items-center justify-center text-theme-text transition-colors"><ChevronDown size={22} /></button>
        </div>

        <div className="text-center py-2"><span className="text-xs text-theme-text-3">{index + 1} / {debates.length}</span></div>
      </div>
    </div>
  );
}
