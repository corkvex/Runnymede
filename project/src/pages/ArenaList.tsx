import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllDebates, getProfile, type StoredDebate, type StoredProfile } from '@/lib/storage';
import { useIdentity } from '@/context/IdentityContext';
import { Swords, Radio, Plus, Loader2, Clock, Trophy } from 'lucide-react';
import EloBadge from '@/components/EloBadge';

export default function ArenaList() {
  const { identity } = useIdentity();
  const [debates, setDebates] = useState<StoredDebate[]>([]);
  const [profiles, setProfiles] = useState<Record<string, StoredProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const all = await getAllDebates();
      all.sort((a, b) => b.createdAt - a.createdAt);
      setDebates(all);
      const map: Record<string, StoredProfile> = {};
      for (const d of all) {
        if (d.proId && d.proId !== 'pending' && !map[d.proId]) {
          const p = await getProfile(d.proId);
          if (p) map[d.proId] = p;
        }
        if (d.conId && d.conId !== 'pending' && !map[d.conId]) {
          const p = await getProfile(d.conId);
          if (p) map[d.conId] = p;
        }
      }
      setProfiles(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const live = debates.filter((d) => d.status === 'live');
  const waiting = debates.filter((d) => d.status === 'waiting');
  const ended = debates.filter((d) => d.status === 'ended');

  const statusBadge = (status: string) => {
    if (status === 'live') return <span className="text-xs font-medium text-red-400 flex items-center gap-1"><Radio size={10} className="animate-pulse" /> LIVE</span>;
    if (status === 'waiting') return <span className="text-xs font-medium text-amber-400 flex items-center gap-1"><Clock size={10} /> Waiting</span>;
    return <span className="text-xs font-medium text-theme-text-3 flex items-center gap-1"><Trophy size={10} /> Ended</span>;
  };

  const DebateCard = ({ debate }: { debate: StoredDebate }) => {
    const pro = debate.proId !== 'pending' ? profiles[debate.proId] : null;
    const con = debate.conId !== 'pending' ? profiles[debate.conId] : null;
    return (
      <Link to={`/arena/${debate.id}`} className="block bg-theme-surface border border-theme-border rounded-xl p-4 hover:border-amber-500/40 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          {statusBadge(debate.status)}
          <span className="text-xs text-theme-text-3">{new Date(debate.createdAt).toLocaleDateString()}</span>
        </div>
        <h3 className="text-sm font-semibold text-theme-text group-hover:text-amber-400 transition-colors mb-1 line-clamp-2">{debate.title}</h3>
        <p className="text-xs text-theme-text-3 italic mb-3 line-clamp-1">"{debate.topic}"</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-400">PRO</span>
              {pro ? (
                <span className="text-xs font-mono text-theme-text-2">{pro.handle}</span>
              ) : (
                <span className="text-xs text-theme-text-3">Open</span>
              )}
            </div>
            <span className="text-theme-border text-xs">vs</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-400">CON</span>
              {con ? (
                <span className="text-xs font-mono text-theme-text-2">{con.handle}</span>
              ) : (
                <span className="text-xs text-theme-text-3">Open</span>
              )}
            </div>
          </div>
          {(pro || con) && (
            <EloBadge elo={pro?.elo || con?.elo || 1000} size="sm" />
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Swords size={28} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-theme-text">Debate Arena</h1>
        </div>
        {identity && (
          <Link to="/arena/new" className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-full transition-colors">
            <Plus size={18} /> New Debate
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-theme-text-3" /></div>
      ) : debates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Swords size={48} className="text-theme-border mb-4" />
          <p className="text-theme-text-3 text-lg">No debates yet</p>
          {identity ? (
            <Link to="/arena/new" className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium">Start the first debate</Link>
          ) : (
            <Link to="/onboarding" className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium">Create an identity to debate</Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {live.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2"><Radio size={14} className="animate-pulse" /> Live Now ({live.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {live.map((d) => <DebateCard key={d.id} debate={d} />)}
              </div>
            </section>
          )}
          {waiting.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2"><Clock size={14} /> Awaiting Opponent ({waiting.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waiting.map((d) => <DebateCard key={d.id} debate={d} />)}
              </div>
            </section>
          )}
          {ended.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-theme-text-3 uppercase tracking-wide mb-3 flex items-center gap-2"><Trophy size={14} /> Past Debates ({ended.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ended.map((d) => <DebateCard key={d.id} debate={d} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
