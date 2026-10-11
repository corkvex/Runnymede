import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getTrendingCreators, getLiveCreators, getTopCreators, getPublicDebates,
  type PublicProfile, type PublicDebate, DEBATE_CATEGORIES, getDisplayName, getPublicRank,
} from '@/lib/registry';
import { useIdentity } from '@/context/IdentityContext';
import { saveFollow, removeFollow, isFollowing } from '@/lib/storage';
import EloBadge from '@/components/EloBadge';
import {
  TrendingUp, Radio, Compass, Users, BadgeCheck, UserPlus, UserCheck,
  Flame, Swords, ArrowRight,
} from 'lucide-react';

type Tab = 'trending' | 'live' | 'categories';

export default function Discover() {
  const { identity } = useIdentity();
  const [tab, setTab] = useState<Tab>('trending');
  const [trending, setTrending] = useState<PublicProfile[]>([]);
  const [live, setLive] = useState<PublicProfile[]>([]);
  const [categoryCreators, setCategoryCreators] = useState<PublicProfile[]>([]);
  const [liveDebates, setLiveDebates] = useState<PublicDebate[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Politics');
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    const [t, l, d] = await Promise.all([
      getTrendingCreators(24),
      getLiveCreators(),
      getPublicDebates('live'),
    ]);
    setTrending(t);
    setLive(l);
    setLiveDebates(d);
    setLoading(false);
  }, []);

  const fetchCategory = useCallback(async (cat: string) => {
    setLoading(true);
    const creators = await getTopCreators(cat, 24);
    setCategoryCreators(creators);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  useEffect(() => {
    if (tab === 'categories') fetchCategory(activeCategory);
  }, [tab, activeCategory, fetchCategory]);

  // Load follow states for displayed creators
  useEffect(() => {
    if (!identity) return;
    const creators = tab === 'categories' ? categoryCreators : tab === 'live' ? live : trending;
    (async () => {
      const states: Record<string, boolean> = {};
      for (const c of creators) {
        if (c.id !== identity.fullId) {
          states[c.id] = await isFollowing(identity.fullId, c.id);
        }
      }
      setFollowStates(states);
    })();
  }, [identity, trending, live, categoryCreators, tab]);

  const handleFollow = async (creator: PublicProfile) => {
    if (!identity) return;
    const isFollowingNow = followStates[creator.id];
    if (isFollowingNow) {
      await removeFollow(identity.fullId, creator.id);
    } else {
      await saveFollow({
        id: `${identity.fullId}-${creator.id}`,
        followerId: identity.fullId,
        targetId: creator.id,
        targetHandle: creator.handle,
        followedAt: Date.now(),
      });
    }
    setFollowStates((prev) => ({ ...prev, [creator.id]: !isFollowingNow }));
  };

  const tabBtn = (t: Tab, label: string, Icon: typeof TrendingUp) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        tab === t ? 'bg-theme-text text-theme-base' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );

  const CreatorCard = ({ creator }: { creator: PublicProfile }) => {
    const rank = getPublicRank(creator);
    const name = getDisplayName(creator);
    const isOwn = identity?.fullId === creator.id;
    const isFollowingCreator = followStates[creator.id] || false;

    return (
      <div className="group bg-theme-surface border border-theme-border rounded-xl p-4 hover:border-amber-500/40 transition-colors">
        <div className="flex items-start gap-3">
          <Link to={`/profile/${creator.id}`} className="shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: rank.color }}>
              {creator.handle.substring(1, 3).toUpperCase()}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${creator.id}`} className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-theme-text group-hover:text-amber-400 transition-colors truncate">{name}</p>
              {creator.is_verified && <BadgeCheck size={14} className="text-blue-400 shrink-0" />}
            </Link>
            <p className="text-xs font-mono text-theme-text-3 truncate">{creator.handle}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <EloBadge elo={creator.elo} size="sm" />
              {creator.is_live && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <Radio size={10} className="animate-pulse" /> Live
                </span>
              )}
            </div>
          </div>
          {identity && !isOwn && (
            <button
              onClick={() => handleFollow(creator)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isFollowingCreator
                  ? 'bg-theme-elevated border border-theme-border text-theme-text-2'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isFollowingCreator ? <UserCheck size={12} /> : <UserPlus size={12} />}
              {isFollowingCreator ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        {creator.bio && (
          <p className="text-xs text-theme-text-3 mt-2 line-clamp-2">{creator.bio}</p>
        )}
        {creator.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {creator.categories.slice(0, 4).map((cat) => (
              <span key={cat} className="px-2 py-0.5 bg-amber-950/20 border border-amber-800/20 rounded-full text-[10px] text-amber-500/80">
                {cat}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-theme-text-3">
          <span className="flex items-center gap-1"><Users size={11} /> {creator.follower_count}</span>
          <span>{creator.debates_won}W · {creator.debates_lost}L</span>
        </div>
      </div>
    );
  };

  const displayedCreators = tab === 'categories' ? categoryCreators : tab === 'live' ? live : trending;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Compass size={28} className="text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Discover Creators</h1>
          <p className="text-sm text-theme-text-3 mt-0.5">Find public debaters by topic, trending rank, or live status</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {tabBtn('trending', 'Trending', Flame)}
        {tabBtn('live', 'Live Now', Radio)}
        {tabBtn('categories', 'By Category', Compass)}
      </div>

      {/* Category filter pills */}
      {tab === 'categories' && (
        <div className="flex flex-wrap gap-2 mb-6">
          {DEBATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-theme-surface border border-theme-border text-theme-text-3 hover:border-amber-500/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Live debates strip */}
      {tab !== 'categories' && liveDebates.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Swords size={16} className="text-red-400" />
            <h2 className="text-sm font-semibold text-theme-text">Live Debates</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {liveDebates.map((d) => (
              <Link
                key={d.id}
                to={`/arena/${d.id}`}
                className="group shrink-0 w-64 bg-theme-surface border border-red-800/30 rounded-xl p-4 hover:border-red-500/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Radio size={10} className="text-red-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-red-400">LIVE</span>
                </div>
                <p className="text-sm font-semibold text-theme-text group-hover:text-red-400 transition-colors truncate">{d.title}</p>
                <p className="text-xs text-theme-text-3 mt-1 truncate">{d.topic}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-theme-text-3">
                  <span>{d.pro_handle || 'TBD'} vs {d.con_handle || 'TBD'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Creators grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : displayedCreators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Compass size={48} className="text-theme-border mb-4" />
          <p className="text-theme-text-3 text-lg">
            {tab === 'live' ? 'No creators live right now' : 'No public creators found'}
          </p>
          <p className="text-theme-text-3 text-sm mt-2">
            {tab === 'live' ? 'Check back later or start your own debate' : 'Be the first to publish your profile'}
          </p>
          {identity && (
            <Link to="/profile" className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-full transition-colors">
              Publish Your Profile <ArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            {tab === 'trending' && <><TrendingUp size={16} className="text-amber-400" /><h2 className="text-sm font-semibold text-theme-text">Trending Creators</h2></>}
            {tab === 'live' && <><Radio size={16} className="text-red-400" /><h2 className="text-sm font-semibold text-theme-text">Creators Live Now</h2></>}
            {tab === 'categories' && <><Compass size={16} className="text-amber-400" /><h2 className="text-sm font-semibold text-theme-text">{activeCategory} Creators</h2></>}
            <span className="text-xs text-theme-text-3">({displayedCreators.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedCreators.map((c) => <CreatorCard key={c.id} creator={c} />)}
          </div>
        </>
      )}
    </div>
  );
}
