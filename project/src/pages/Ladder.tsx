import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRankFromElo, type RankTier, type RankInfo } from '@/lib/elo';
import EloBadge from '@/components/EloBadge';
import {
  getAllPublicCreators, getCreatorsByRegion, getPublicRank, getDisplayName,
  type PublicProfile, DEBATE_REGIONS,
} from '@/lib/registry';
import { Trophy, Globe, MapPin, Radio, BadgeCheck } from 'lucide-react';

type View = 'global' | 'regional';

const TIER_INFO: { tier: RankTier; range: string }[] = [
  { tier: 'Novice', range: '0 – 1199' },
  { tier: 'Intermediate', range: '1200 – 1599' },
  { tier: 'Advanced', range: '1600 – 1999' },
  { tier: 'Expert', range: '2000 – 2199' },
  { tier: 'Master', range: '2200 – 2499' },
  { tier: 'Grandmaster', range: '2500+' },
];

export default function Ladder() {
  const [view, setView] = useState<View>('global');
  const [allCreators, setAllCreators] = useState<PublicProfile[]>([]);
  const [regionalCreators, setRegionalCreators] = useState<PublicProfile[]>([]);
  const [activeRegion, setActiveRegion] = useState<string>('North America');
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<RankTier | null>(null);

  const tiers: RankTier[] = ['Novice', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster'];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const creators = await getAllPublicCreators(100);
    setAllCreators(creators);
    setLoading(false);
  }, []);

  const fetchRegional = useCallback(async (region: string) => {
    setLoading(true);
    const creators = await getCreatorsByRegion(region, 50);
    setRegionalCreators(creators);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (view === 'regional') fetchRegional(activeRegion);
  }, [view, activeRegion, fetchRegional]);

  const displayed = view === 'regional' ? regionalCreators : allCreators;
  const filtered = tierFilter
    ? displayed.filter((p) => getPublicRank(p).tier === tierFilter)
    : displayed;

  const renderRow = (p: PublicProfile, i: number) => {
    const name = getDisplayName(p);

    return (
      <Link
        key={p.id}
        to={`/profile/${p.id}`}
        className="group flex items-center gap-4 bg-theme-surface border border-theme-border rounded-xl p-3 hover:bg-theme-hover transition-colors"
      >
        <div className="w-10 text-center shrink-0 text-sm font-bold text-theme-text-3">
          #{i + 1}
        </div>
        {p.avatar_url ? (
          <img
            src={p.avatar_url}
            alt={name}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-theme-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-theme-elevated border border-theme-border">
            {p.handle.substring(1, 3).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-theme-text group-hover:text-amber-400 transition-colors truncate">
              {name}
            </p>
            {p.is_verified && <BadgeCheck size={14} className="text-blue-400 shrink-0" />}
            {p.is_live && <Radio size={12} className="text-red-400 animate-pulse shrink-0" />}
          </div>
          {p.region && (
            <p className="text-xs text-theme-text-3 flex items-center gap-1">
              <MapPin size={10} /> {p.region}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <EloBadge elo={p.elo} size="sm" />
        </div>
      </Link>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={28} className="text-yellow-400" />
        <h1 className="text-2xl font-bold text-theme-text">Global Rankings</h1>
      </div>

      {/* Tier legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
        {TIER_INFO.map((t) => {
          const info = getRankFromElo(
            t.range.includes('+') ? 9999 : parseInt(t.range.split('–')[0].trim()) || 0,
            10,
          ) as RankInfo;
          return (
            <div
              key={t.tier}
              className="flex items-center gap-2 bg-theme-surface border border-theme-border rounded-lg px-3 py-2"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: info.color, border: info.color === '#171717' ? '1px solid #404040' : 'none' }}
              />
              <span className="text-xs font-medium text-theme-text">{t.tier}</span>
              <span className="text-xs text-theme-text-3 ml-auto">{t.range}</span>
            </div>
          );
        })}
      </div>

      {/* View toggle: Global vs Regional */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('global')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'global' ? 'bg-theme-text text-theme-base' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'
          }`}
        >
          <Globe size={15} /> Global
        </button>
        <button
          onClick={() => setView('regional')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'regional' ? 'bg-theme-text text-theme-base' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'
          }`}
        >
          <MapPin size={15} /> Regional
        </button>
      </div>

      {/* Regional filter pills */}
      {view === 'regional' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {DEBATE_REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRegion(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeRegion === r
                  ? 'bg-amber-600 text-white'
                  : 'bg-theme-surface border border-theme-border text-theme-text-3 hover:border-amber-500/40'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Tier filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setTierFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            tierFilter === null ? 'bg-theme-active text-theme-active-fg' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'
          }`}
        >
          All Tiers
        </button>
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tierFilter === t ? 'bg-theme-active text-theme-active-fg' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trophy size={48} className="text-theme-border mb-4" />
          <p className="text-theme-text-3 text-lg">
            {view === 'regional'
              ? `No public creators in ${activeRegion} yet`
              : 'No public creators in this tier yet'}
          </p>
          <p className="text-theme-text-3 text-sm mt-2">
            Only creators who publish their profile appear in rankings.
          </p>
        </div>
      ) : (
        <>
          {view === 'regional' && (
            <p className="text-xs text-theme-text-3 mb-3 flex items-center gap-1">
              <MapPin size={12} /> Showing {filtered.length} ranked creator{filtered.length !== 1 ? 's' : ''} in {activeRegion}
            </p>
          )}
          {view === 'global' && (
            <p className="text-xs text-theme-text-3 mb-3 flex items-center gap-1">
              <Globe size={12} /> Showing {filtered.length} public ranked creator{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
          <div className="space-y-2">
            {filtered.map((p, i) => renderRow(p, i))}
          </div>
        </>
      )}
    </div>
  );
}
