import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAllVideos, getAllDebates, getAllProfiles, getProfile, type StoredVideo, type StoredDebate, type StoredProfile } from '@/lib/storage';
import VideoCard from '@/components/VideoCard';
import { Search as SearchIcon, Swords, Shield as ShieldIcon, BadgeCheck, Globe } from 'lucide-react';
import { getRankFromElo } from '@/lib/elo';
import { searchPublicProfiles, type PublicProfile, getDisplayName, getPublicRank } from '@/lib/registry';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [debates, setDebates] = useState<StoredDebate[]>([]);
  const [localProfiles, setLocalProfiles] = useState<StoredProfile[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<PublicProfile[]>([]);
  const [uploaders, setUploaders] = useState<Record<string, StoredProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    const q = query.toLowerCase();
    const fetch = async () => {
      const [allVideos, allDebates, allProfiles, pubResults] = await Promise.all([
        getAllVideos(),
        getAllDebates(),
        getAllProfiles(),
        searchPublicProfiles(query),
      ]);

      setVideos(allVideos.filter((v) =>
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q)
      ).sort((a, b) => b.createdAt - a.createdAt));

      setDebates(allDebates.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        d.topic.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      ).sort((a, b) => b.createdAt - a.createdAt));

      // Filter out local profiles that are already in public results
      const pubIds = new Set(pubResults.map((p) => p.id));
      setLocalProfiles(allProfiles.filter((p) =>
        !pubIds.has(p.id) && (
          p.handle.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q)
        )
      ).sort((a, b) => b.elo - a.elo));
      setPublicProfiles(pubResults);

      const map: Record<string, StoredProfile> = {};
      for (const v of allVideos.filter((v) => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q))) {
        if (!map[v.userId]) {
          const p = await getProfile(v.userId);
          if (p) map[v.userId] = p;
        }
      }
      setUploaders(map);
      setLoading(false);
    };
    fetch();
  }, [query]);

  const hasResults = videos.length > 0 || debates.length > 0 || localProfiles.length > 0 || publicProfiles.length > 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <SearchIcon size={24} className="text-theme-text-3" />
        <h1 className="text-xl font-bold text-theme-text">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : !query ? (
        <p className="text-theme-text-3 text-sm text-center py-20">Type something in the search bar above.</p>
      ) : !hasResults ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon size={48} className="text-theme-border mb-4" />
          <p className="text-theme-text-3 text-lg">No results found</p>
          <p className="text-theme-text-3 text-sm mt-2">Try different keywords.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Public creators from registry */}
          {publicProfiles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-theme-text-3 uppercase tracking-wide">Public Creators ({publicProfiles.length})</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {publicProfiles.map((p) => {
                  const rank = getPublicRank(p);
                  const name = getDisplayName(p);
                  return (
                    <Link key={p.id} to={`/profile/${p.id}`} className="group bg-theme-surface border border-emerald-800/20 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: rank.color }}>
                          {p.handle.substring(1, 3).toUpperCase()}
                        </div>
                        {p.is_verified && <BadgeCheck size={14} className="text-blue-400" />}
                      </div>
                      <p className="text-sm font-semibold text-theme-text group-hover:text-amber-400 transition-colors truncate">{name}</p>
                      <p className="text-xs font-mono text-theme-text-3 truncate">{p.handle}</p>
                      <p className="text-xs text-theme-text-3 mt-0.5">{p.elo} Elo · {p.debates_won}W</p>
                      {p.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.categories.slice(0, 2).map((cat) => (
                            <span key={cat} className="px-1.5 py-0.5 bg-amber-950/20 rounded-full text-[9px] text-amber-500/70">{cat}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Local profiles */}
          {localProfiles.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-theme-text-3 uppercase tracking-wide mb-3">Debaters ({localProfiles.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {localProfiles.map((p) => {
                  const rank = getRankFromElo(p.elo);
                  return (
                    <Link key={p.id} to={`/profile/${p.id}`} className="group bg-theme-surface border border-theme-border rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: rank.color }}>
                          {p.handle.substring(1, 3).toUpperCase()}
                        </div>
                        <ShieldIcon size={14} className="text-theme-text-3" />
                      </div>
                      <p className="text-xs font-mono text-theme-text group-hover:text-amber-400 transition-colors truncate">{p.handle}</p>
                      <p className="text-xs text-theme-text-3 mt-0.5">{p.elo} Elo · {p.debatesWon}W</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {debates.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-theme-text-3 uppercase tracking-wide mb-3">Debates ({debates.length})</h2>
              <div className="space-y-2">
                {debates.map((d) => (
                  <Link key={d.id} to={`/arena/${d.id}`} className="group flex items-center gap-3 bg-theme-surface border border-theme-border rounded-xl p-3 hover:bg-theme-hover transition-colors">
                    <Swords size={20} className="text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-theme-text group-hover:text-amber-400 transition-colors truncate">{d.title}</p>
                      <p className="text-xs text-theme-text-3 truncate mt-0.5">{d.topic}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-theme-text-3 uppercase tracking-wide mb-3">Videos ({videos.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((v) => <VideoCard key={v.id} video={v} uploader={uploaders[v.userId]} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
