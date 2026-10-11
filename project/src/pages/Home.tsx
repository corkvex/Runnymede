import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllDebates, getAllProfiles, type StoredDebate, type StoredProfile } from '@/lib/storage';
import { getRankFromElo } from '@/lib/elo';
import { useIdentity } from '@/context/IdentityContext';
import GeofenceNotice from '@/components/GeofenceNotice';
import EloBadge from '@/components/EloBadge';
import { Swords, Trophy, Radio, Users, Zap, ArrowRight, Compass } from 'lucide-react';

export default function Home() {
  const { identity, profile } = useIdentity();
  const [debates, setDebates] = useState<StoredDebate[]>([]);
  const [topDebaters, setTopDebaters] = useState<StoredProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [allDebates, allProfiles] = await Promise.all([
        getAllDebates(),
        getAllProfiles(),
      ]);
      setDebates(allDebates.sort((a, b) => b.createdAt - a.createdAt));
      setTopDebaters(allProfiles.sort((a, b) => b.elo - a.elo).slice(0, 8));
      setLoading(false);
    };
    fetchData();
  }, []);

  const liveDebates = debates.filter((d) => d.status === 'live');
  const upcomingDebates = debates.filter((d) => d.status === 'waiting');
  const recentDebates = debates.filter((d) => d.status === 'ended').slice(0, 6);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-950/40 via-theme-surface to-theme-surface border border-amber-900/30 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Swords size={28} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-theme-text">The Runnymede Floor</h1>
        </div>
        <p className="text-theme-text-2 text-sm max-w-2xl">
          Enter a decentralized debate arena where your arguments matter, not your identity.
          Compete for Elo rank, vote on live debates, and communicate with zero surveillance.
        </p>
        {identity && profile && (
          <div className="flex items-center gap-3 mt-4">
            <EloBadge elo={profile.elo} size="md" />
            <span className="text-sm text-theme-text-3">
              {profile.debatesWon}W · {profile.debatesLost}L
            </span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <GeofenceNotice />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Now */}
          {liveDebates.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Radio size={18} className="text-red-400 animate-pulse" />
                <h2 className="text-lg font-semibold text-theme-text">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveDebates.map((d) => (
                  <Link key={d.id} to={`/arena/${d.id}`} className="group bg-theme-surface border border-red-800/30 rounded-xl p-4 hover:border-red-500/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                        <Radio size={10} className="animate-pulse" /> LIVE
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-theme-text group-hover:text-red-400 transition-colors">{d.title}</h3>
                    <p className="text-sm text-theme-text-3 mt-1 italic">{d.topic}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-theme-text-3">
                      <Users size={12} /> {d.proVotes + d.conVotes} votes cast
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link to="/arena/new" className="group bg-theme-surface border border-theme-border rounded-xl p-5 hover:border-amber-500/40 transition-colors">
                <Swords size={24} className="text-amber-400 mb-2" />
                <h3 className="text-sm font-semibold text-theme-text group-hover:text-amber-400 transition-colors">Start a Debate</h3>
                <p className="text-xs text-theme-text-3 mt-1">Challenge someone to a ranked match</p>
              </Link>
              <Link to="/discover" className="group bg-theme-surface border border-emerald-700/20 rounded-xl p-5 hover:border-emerald-500/40 transition-colors">
                <Compass size={24} className="text-emerald-400 mb-2" />
                <h3 className="text-sm font-semibold text-theme-text group-hover:text-emerald-400 transition-colors">Discover Creators</h3>
                <p className="text-xs text-theme-text-3 mt-1">Find public debaters by topic</p>
              </Link>
              <Link to="/ladder" className="group bg-theme-surface border border-theme-border rounded-xl p-5 hover:border-amber-500/40 transition-colors">
                <Trophy size={24} className="text-yellow-400 mb-2" />
                <h3 className="text-sm font-semibold text-theme-text group-hover:text-amber-400 transition-colors">View Rankings</h3>
                <p className="text-xs text-theme-text-3 mt-1">See the top debaters on the ladder</p>
              </Link>
              <Link to="/shorts" className="group bg-theme-surface border border-theme-border rounded-xl p-5 hover:border-amber-500/40 transition-colors">
                <Zap size={24} className="text-blue-400 mb-2" />
                <h3 className="text-sm font-semibold text-theme-text group-hover:text-amber-400 transition-colors">Shorts</h3>
                <p className="text-xs text-theme-text-3 mt-1">Quick takes and debate clips</p>
              </Link>
            </div>
          </section>

          {/* Top Debaters */}
          {topDebaters.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-400" />
                  <h2 className="text-lg font-semibold text-theme-text">Top Debaters</h2>
                </div>
                <Link to="/ladder" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  Full ladder <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {topDebaters.map((p, i) => {
                  const rank = getRankFromElo(p.elo);
                  return (
                    <Link key={p.id} to={`/profile/${p.id}`} className="group bg-theme-surface border border-theme-border rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-theme-text-3">#{i + 1}</span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: rank.color }}>
                          {p.handle.substring(1, 3).toUpperCase()}
                        </div>
                      </div>
                      <p className="text-xs font-mono text-theme-text group-hover:text-amber-400 transition-colors truncate">{p.handle}</p>
                      <div className="mt-1.5"><EloBadge elo={p.elo} size="sm" /></div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent Debates */}
          {recentDebates.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-theme-text mb-3">Recent Results</h2>
              <div className="space-y-2">
                {recentDebates.map((d) => (
                  <Link key={d.id} to={`/arena/${d.id}`} className="group flex items-center justify-between bg-theme-surface border border-theme-border rounded-xl p-3 hover:bg-theme-hover transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-theme-text group-hover:text-amber-400 transition-colors truncate">{d.title}</p>
                      <p className="text-xs text-theme-text-3 mt-0.5">{d.topic}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {d.winnerId && <span className="text-xs text-green-400 font-medium">Winner decided</span>}
                      <ArrowRight size={14} className="text-theme-text-3 group-hover:text-amber-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {debates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Swords size={48} className="text-theme-border mb-4" />
              <p className="text-theme-text-3 text-lg">No debates yet</p>
              <p className="text-theme-text-3 text-sm mt-2">Be the first to step onto the floor.</p>
              {identity && (
                <Link to="/arena/new" className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-full transition-colors">
                  <Swords size={18} /> Start a Debate
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
