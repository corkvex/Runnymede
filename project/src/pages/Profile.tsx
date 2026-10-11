import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getProfile, getAllDebates, saveProfile, saveFollow, removeFollow, isFollowing,
  type StoredProfile, type StoredDebate,
} from '@/lib/storage';
import { getRankFromElo } from '@/lib/elo';
import { signData } from '@/lib/crypto';
import { useIdentity } from '@/context/IdentityContext';
import EloBadge from '@/components/EloBadge';
import {
  Swords, Trophy, Shield, Key, Copy, Check, Globe, X,
  BadgeCheck, UserPlus, UserCheck, Radio, Sparkles,
} from 'lucide-react';
import {
  publishProfile, unpublishProfile, getPublicProfile,
  type PublicProfile,
} from '@/lib/registry';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { identity } = useIdentity();
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [debates, setDebates] = useState<StoredDebate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(false);
  const [publicData, setPublicData] = useState<PublicProfile | null>(null);
  const [editBio, setEditBio] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editRegion, setEditRegion] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [sigToCopy, setSigToCopy] = useState<string | null>(null);
  const [sigCopied, setSigCopied] = useState(false);

  const profileId = id || identity?.fullId;

  const fetchProfile = useCallback(async () => {
    if (!profileId) { setLoading(false); return; }
    const p = await getProfile(profileId);
    setProfile(p || null);
    if (p) {
      setEditBio(p.bio);
      setEditDisplayName(p.handle);
    }
    const all = await getAllDebates();
    setDebates(all.filter((d) => d.proId === profileId || d.conId === profileId).sort((a, b) => b.createdAt - a.createdAt));
    const pub = await getPublicProfile(profileId);
    setPublicData(pub);
    if (pub?.display_name) setEditDisplayName(pub.display_name);
    if (pub?.categories) setEditCategories(pub.categories);
    if (pub?.region) setEditRegion(pub.region);
    if (identity && identity.fullId !== profileId) {
      setFollowing(await isFollowing(identity.fullId, profileId));
    }
    setLoading(false);
  }, [profileId, identity]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handlePublish = async () => {
    if (!profile || !identity) return;
    setPublishing(true);
    const pub = await publishProfile(profile, editDisplayName, editCategories, editRegion);
    if (pub) {
      setPublicData(pub);
      const updated = { ...profile, bio: editBio };
      await saveProfile(updated);
      setProfile(updated);
    }
    setPublishing(false);
  };

  const handleUnpublish = async () => {
    if (!profile) return;
    const ok = await unpublishProfile(profile.id);
    if (ok) setPublicData(null);
  };

  const handleFollow = async () => {
    if (!identity || !profile) return;
    if (following) {
      await removeFollow(identity.fullId, profile.id);
      setFollowing(false);
    } else {
      await saveFollow({
        id: `${identity.fullId}-${profile.id}`,
        followerId: identity.fullId,
        targetId: profile.id,
        targetHandle: profile.handle,
        followedAt: Date.now(),
      });
      setFollowing(true);
    }
  };

  const handleGenerateSig = async () => {
    if (!identity || !profile) return;
    const challenge = `agora-verify-${profile.id}-${Date.now()}`;
    const sig = await signData(challenge, identity);
    setSigToCopy(`${challenge}\n${sig}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-theme-text-3 text-lg">Profile not found</p>
        <Link to="/" className="text-amber-400 hover:text-amber-300 mt-2">Back to home</Link>
      </div>
    );
  }

  const rank = getRankFromElo(profile.elo);
  const isOwn = identity?.fullId === profile.id;
  const wins = profile.debatesWon;
  const losses = profile.debatesLost;
  const total = wins + losses;
  const isPublic = !!publicData;
  const displayName = publicData?.display_name || profile.handle;

  return (
    <div className="max-w-4xl px-4 md:px-6">
        {/* Avatar + identity */}
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-theme-base shrink-0" style={{ backgroundColor: rank.color }}>
            {profile.handle.substring(1, 3).toUpperCase()}
          </div>
          <div className="pt-8 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-theme-text">{displayName}</h1>
              {publicData?.is_verified && (
                <BadgeCheck size={18} className="text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-xs font-mono text-theme-text-3 mt-0.5">{profile.handle}</p>
            <div className="flex items-center gap-3 mt-2">
              <EloBadge elo={profile.elo} size="md" />
            </div>
          </div>
          {/* Follow / Edit buttons */}
          {!isOwn && identity && (
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                following
                  ? 'bg-theme-surface border border-theme-border text-theme-text-2 hover:border-red-500/40'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Public categories + region */}
        {isPublic && (publicData.categories.length > 0 || publicData.region) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {publicData.region && (
              <span className="px-2.5 py-1 bg-emerald-950/30 border border-emerald-700/30 rounded-full text-xs text-emerald-400">
                {publicData.region}
              </span>
            )}
            {publicData.categories.map((cat) => (
              <span key={cat} className="px-2.5 py-1 bg-amber-950/30 border border-amber-800/30 rounded-full text-xs text-amber-400">
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Public key box (own profile) */}
        {isOwn && (
          <div className="mt-4 bg-theme-surface border border-theme-border rounded-xl p-3 flex items-center gap-2">
            <Key size={16} className="text-amber-400 shrink-0" />
            <span className="text-xs text-theme-text-3 font-mono truncate flex-1">{identity?.publicKeyB64.substring(0, 40)}...</span>
            <button onClick={() => { navigator.clipboard.writeText(identity?.publicKeyB64 || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0 text-theme-text-3 hover:text-theme-text transition-colors">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        )}

        {/* Bio */}
        <p className="text-sm text-theme-text-2 mt-4">{profile.bio}</p>

        {/* Publish / Unpublish controls */}
        {isOwn && (
          <div className="mt-4 flex flex-wrap gap-2">
            {!isPublic ? (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Globe size={16} /> Publish Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Sparkles size={16} /> Update Public Profile
                </button>
                <button
                  onClick={handleUnpublish}
                  className="flex items-center gap-2 px-4 py-2.5 bg-theme-surface border border-theme-border text-theme-text-2 text-sm font-medium rounded-lg hover:border-red-500/40 transition-colors"
                >
                  <X size={16} /> Unpublish
                </button>
              </>
            )}
            {/* Cryptographic verification */}
            <button
              onClick={handleGenerateSig}
              className="flex items-center gap-2 px-4 py-2.5 bg-theme-surface border border-theme-border text-theme-text-2 text-sm font-medium rounded-lg hover:border-blue-500/40 transition-colors"
            >
              <Shield size={16} /> Generate Verification Sig
            </button>
          </div>
        )}

        {/* Signature output */}
        {sigToCopy && (
          <div className="mt-3 bg-theme-surface border border-blue-800/30 rounded-xl p-3">
            <p className="text-xs text-blue-400 mb-2 font-medium">Post this on X/Twitter or YouTube to verify your identity:</p>
            <pre className="text-xs font-mono text-theme-text-3 whitespace-pre-wrap break-all bg-theme-base/50 rounded-lg p-2 max-h-32 overflow-y-auto">{sigToCopy}</pre>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { navigator.clipboard.writeText(sigToCopy); setSigCopied(true); setTimeout(() => setSigCopied(false), 2000); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {sigCopied ? <Check size={12} /> : <Copy size={12} />}
                {sigCopied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => setSigToCopy(null)} className="px-3 py-1.5 text-theme-text-3 text-xs hover:text-theme-text transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-theme-surface border border-theme-border rounded-xl p-4 text-center">
            <Trophy size={20} className="text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-theme-text">{profile.elo}</p>
            <p className="text-xs text-theme-text-3">Elo Rating</p>
          </div>
          <div className="bg-theme-surface border border-theme-border rounded-xl p-4 text-center">
            <Shield size={20} className="text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-theme-text">{wins}</p>
            <p className="text-xs text-theme-text-3">Debates Won</p>
          </div>
          <div className="bg-theme-surface border border-theme-border rounded-xl p-4 text-center">
            <Swords size={20} className="text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-theme-text">{total}</p>
            <p className="text-xs text-theme-text-3">Total Debates</p>
          </div>
        </div>

        {/* Debate history */}
        <div className="mt-6 pb-6">
          <h2 className="text-sm font-semibold text-theme-text-3 uppercase tracking-wide mb-3">Debate History</h2>
          {debates.length === 0 ? (
            <p className="text-theme-text-3 text-sm py-8 text-center">No debates yet.</p>
          ) : (
            <div className="space-y-2">
              {debates.map((d) => {
                const isPro = d.proId === profile.id;
                const won = d.winnerId === profile.id;
                const draw = d.status === 'ended' && !d.winnerId;
                return (
                  <Link key={d.id} to={`/arena/${d.id}`} className="flex items-center justify-between bg-theme-surface border border-theme-border rounded-xl p-3 hover:bg-theme-hover transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-theme-text truncate">{d.title}</p>
                      <p className="text-xs text-theme-text-3 mt-0.5">
                        {isPro ? 'Pro' : 'Con'} · {d.status === 'live' ? 'Live' : d.status === 'waiting' ? 'Waiting' : 'Ended'}
                      </p>
                    </div>
                    {d.status === 'ended' && (
                      <span className={`text-xs font-medium shrink-0 ml-2 ${won ? 'text-green-400' : draw ? 'text-theme-text-3' : 'text-red-400'}`}>
                        {won ? 'WON' : draw ? 'DRAW' : 'LOST'}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
