/**
 * Local-first storage layer using IndexedDB for persistence.
 * All user data stays on-device — no cloud sync, no servers.
 */

export type ContentType = 'video' | 'short' | 'podcast';

export interface StoredVideo {
  id: string;
  userId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  category: string | null;
  contentType: ContentType;
  views: number;
  createdAt: number;
}

export interface StoredLike {
  id: string;
  userId: string;
  videoId: string;
  createdAt: number;
}

const DB_NAME = 'agora_db';
const DB_VERSION = 5;

export interface StoredProfile {
  id: string;
  handle: string;
  publicKey: string;
  elo: number;
  debatesWon: number;
  debatesLost: number;
  bio: string;
  avatarSeed: string;
  createdAt: number;
}

export interface StoredDebate {
  id: string;
  title: string;
  topic: string;
  description: string;
  proId: string;
  conId: string;
  moderatorId: string | null;
  status: 'waiting' | 'live' | 'ended';
  winnerId: string | null;
  proVotes: number;
  conVotes: number;
  createdAt: number;
  endedAt: number | null;
}

export interface StoredVote {
  id: string;
  debateId: string;
  voterId: string;
  targetId: string;
  metric: 'kept_calm' | 'good_logic' | 'fallacy_alert';
  timestamp: number;
}

export interface StoredPositionVote {
  id: string;
  debateId: string;
  voterId: string;
  lean: 'pro' | 'con' | 'neutral';
  round: number;
  timestamp: number;
}

export interface StoredSpectrumPosition {
  id: string;
  debateId: string;
  voterId: string;
  position: number; // -100 (full pro) to 100 (full con), 0 = center
  timestamp: number;
}

export interface StoredMessage {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  signature: string;
  timestamp: number;
  read: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('debates')) {
        db.createObjectStore('debates', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('votes')) {
        db.createObjectStore('votes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('likes')) {
        db.createObjectStore('likes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('follows')) {
        db.createObjectStore('follows', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('position_votes')) {
        db.createObjectStore('position_votes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('spectrum_positions')) {
        db.createObjectStore('spectrum_positions', { keyPath: 'id' });
      }
    };
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Profiles
export async function saveProfile(p: StoredProfile): Promise<void> {
  await tx('profiles', 'readwrite', (s) => s.put(p));
}

export async function getProfile(id: string): Promise<StoredProfile | undefined> {
  return tx('profiles', 'readonly', (s) => s.get(id));
}

export async function getAllProfiles(): Promise<StoredProfile[]> {
  return tx('profiles', 'readonly', (s) => s.getAll());
}

// Debates
export async function saveDebate(d: StoredDebate): Promise<void> {
  await tx('debates', 'readwrite', (s) => s.put(d));
}

export async function getDebate(id: string): Promise<StoredDebate | undefined> {
  return tx('debates', 'readonly', (s) => s.get(id));
}

export async function getAllDebates(): Promise<StoredDebate[]> {
  return tx('debates', 'readonly', (s) => s.getAll());
}

// Votes
export async function saveVote(v: StoredVote): Promise<void> {
  await tx('votes', 'readwrite', (s) => s.put(v));
}

export async function getVotesForDebate(debateId: string): Promise<StoredVote[]> {
  const all = await tx<StoredVote[]>('votes', 'readonly', (s) => s.getAll());
  return all.filter((v) => v.debateId === debateId);
}

export interface VoterLean {
  voterId: string;
  proVotes: number;
  conVotes: number;
  lean: 'pro' | 'con' | 'neutral';
}

/**
 * Computes each voter's historical lean across ALL debates:
 * voters who have voted pro (left) more than con (right) lean left,
 * voters who voted con more than pro lean right.
 */
export async function getVoterLeans(): Promise<VoterLean[]> {
  const allVotes = await tx<StoredVote[]>('votes', 'readonly', (s) => s.getAll());
  const allDebates = await tx<StoredDebate[]>('debates', 'readonly', (s) => s.getAll());
  const debateMap = new Map(allDebates.map((d) => [d.id, d]));

  const tally: Record<string, { pro: number; con: number }> = {};

  for (const v of allVotes) {
    const debate = debateMap.get(v.debateId);
    if (!debate) continue;
    if (!tally[v.voterId]) tally[v.voterId] = { pro: 0, con: 0 };
    if (v.targetId === debate.proId) tally[v.voterId].pro++;
    else if (v.targetId === debate.conId) tally[v.voterId].con++;
  }

  return Object.entries(tally).map(([voterId, t]) => ({
    voterId,
    proVotes: t.pro,
    conVotes: t.con,
    lean: t.pro > t.con ? 'pro' as const : t.con > t.pro ? 'con' as const : 'neutral' as const,
  }));
}

// Position Votes (round-by-round lean: pro/con/neutral)
export async function savePositionVote(v: StoredPositionVote): Promise<void> {
  await tx('position_votes', 'readwrite', (s) => s.put(v));
}

export async function getPositionVotesForRound(debateId: string, round: number): Promise<StoredPositionVote[]> {
  const all = await tx<StoredPositionVote[]>('position_votes', 'readonly', (s) => s.getAll());
  return all.filter((v) => v.debateId === debateId && v.round === round);
}

export async function getAllPositionVotesForDebate(debateId: string): Promise<StoredPositionVote[]> {
  const all = await tx<StoredPositionVote[]>('position_votes', 'readonly', (s) => s.getAll());
  return all.filter((v) => v.debateId === debateId);
}

export async function getVoterLeanForRound(debateId: string, voterId: string, round: number): Promise<StoredPositionVote | undefined> {
  const all = await getPositionVotesForRound(debateId, round);
  return all.find((v) => v.voterId === voterId);
}

export async function deletePositionVotesForRound(debateId: string, round: number): Promise<void> {
  const all = await tx<StoredPositionVote[]>('position_votes', 'readonly', (s) => s.getAll());
  const toDelete = all.filter((v) => v.debateId === debateId && v.round === round);
  const db = await openDB();
  const t = db.transaction('position_votes', 'readwrite');
  for (const v of toDelete) {
    t.objectStore('position_votes').delete(v.id);
  }
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

/** Computes per-debate voter leans from position votes (round-by-round). */
export async function getVoterLeansFromPositionVotes(debateId: string): Promise<VoterLean[]> {
  const allVotes = await getAllPositionVotesForDebate(debateId);
  const tally: Record<string, { pro: number; con: number }> = {};
  for (const v of allVotes) {
    if (!tally[v.voterId]) tally[v.voterId] = { pro: 0, con: 0 };
    if (v.lean === 'pro') tally[v.voterId].pro++;
    else if (v.lean === 'con') tally[v.voterId].con++;
  }
  return Object.entries(tally).map(([voterId, t]) => ({
    voterId,
    proVotes: t.pro,
    conVotes: t.con,
    lean: t.pro > t.con ? 'pro' as const : t.con > t.pro ? 'con' as const : 'neutral' as const,
  }));
}

// Spectrum Positions (permanent lean indicator, does not affect round votes)
export async function saveSpectrumPosition(p: StoredSpectrumPosition): Promise<void> {
  await tx('spectrum_positions', 'readwrite', (s) => s.put(p));
}

export async function getSpectrumPositionsForDebate(debateId: string): Promise<StoredSpectrumPosition[]> {
  const all = await tx<StoredSpectrumPosition[]>('spectrum_positions', 'readonly', (s) => s.getAll());
  return all.filter((p) => p.debateId === debateId);
}

/** Returns all spectrum positions across all debates — used to establish voter ideological baselines. */
export async function getAllSpectrumPositions(): Promise<StoredSpectrumPosition[]> {
  return tx<StoredSpectrumPosition[]>('spectrum_positions', 'readonly', (s) => s.getAll());
}

// Messages
export async function saveMessage(m: StoredMessage): Promise<void> {
  await tx('messages', 'readwrite', (s) => s.put(m));
}

export async function getMessages(userId: string): Promise<StoredMessage[]> {
  const all = await tx<StoredMessage[]>('messages', 'readonly', (s) => s.getAll());
  return all
    .filter((m) => m.fromId === userId || m.toId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function markMessageRead(id: string): Promise<void> {
  const db = await openDB();
  const t = db.transaction('messages', 'readwrite');
  const req = t.objectStore('messages').get(id);
  req.onsuccess = () => {
    const msg = req.result as StoredMessage | undefined;
    if (msg) {
      msg.read = true;
      t.objectStore('messages').put(msg);
    }
  };
}

// Videos
export async function saveVideo(v: StoredVideo): Promise<void> {
  await tx('videos', 'readwrite', (s) => s.put(v));
}

export async function getVideo(id: string): Promise<StoredVideo | undefined> {
  return tx('videos', 'readonly', (s) => s.get(id));
}

export async function getAllVideos(): Promise<StoredVideo[]> {
  return tx('videos', 'readonly', (s) => s.getAll());
}

export async function getVideosByType(contentType: ContentType): Promise<StoredVideo[]> {
  const all = await tx<StoredVideo[]>('videos', 'readonly', (s) => s.getAll());
  return all.filter((v) => v.contentType === contentType);
}

export async function getVideosByUser(userId: string): Promise<StoredVideo[]> {
  const all = await tx<StoredVideo[]>('videos', 'readonly', (s) => s.getAll());
  return all.filter((v) => v.userId === userId);
}

export async function incrementVideoViews(id: string): Promise<void> {
  const v = await getVideo(id);
  if (v) {
    v.views += 1;
    await saveVideo(v);
  }
}

// Likes
export async function saveLike(l: StoredLike): Promise<void> {
  await tx('likes', 'readwrite', (s) => s.put(l));
}

export async function removeLike(userId: string, videoId: string): Promise<void> {
  const all = await tx<StoredLike[]>('likes', 'readonly', (s) => s.getAll());
  const like = all.find((l) => l.userId === userId && l.videoId === videoId);
  if (like) {
    await tx('likes', 'readwrite', (s) => s.delete(like.id));
  }
}

export async function isLiked(userId: string, videoId: string): Promise<boolean> {
  const all = await tx<StoredLike[]>('likes', 'readonly', (s) => s.getAll());
  return all.some((l) => l.userId === userId && l.videoId === videoId);
}

export async function getLikeCount(videoId: string): Promise<number> {
  const all = await tx<StoredLike[]>('likes', 'readonly', (s) => s.getAll());
  return all.filter((l) => l.videoId === videoId).length;
}

export async function getLikedVideos(userId: string): Promise<StoredVideo[]> {
  const allLikes = await tx<StoredLike[]>('likes', 'readonly', (s) => s.getAll());
  const likedIds = allLikes.filter((l) => l.userId === userId).map((l) => l.videoId);
  const allVideos = await getAllVideos();
  return allVideos.filter((v) => likedIds.includes(v.id));
}

// Follows — stored locally only, never synced to a server
export interface StoredFollow {
  id: string;
  followerId: string;
  targetId: string;
  targetHandle: string;
  followedAt: number;
}

export async function saveFollow(f: StoredFollow): Promise<void> {
  await tx('follows', 'readwrite', (s) => s.put(f));
}

export async function removeFollow(followerId: string, targetId: string): Promise<void> {
  const all = await tx<StoredFollow[]>('follows', 'readonly', (s) => s.getAll());
  const follow = all.find((f) => f.followerId === followerId && f.targetId === targetId);
  if (follow) {
    await tx('follows', 'readwrite', (s) => s.delete(follow.id));
  }
}

export async function isFollowing(followerId: string, targetId: string): Promise<boolean> {
  const all = await tx<StoredFollow[]>('follows', 'readonly', (s) => s.getAll());
  return all.some((f) => f.followerId === followerId && f.targetId === targetId);
}

export async function getFollowing(followerId: string): Promise<StoredFollow[]> {
  const all = await tx<StoredFollow[]>('follows', 'readonly', (s) => s.getAll());
  return all.filter((f) => f.followerId === followerId).sort((a, b) => b.followedAt - a.followedAt);
}

export async function getFollowerCount(targetId: string): Promise<number> {
  const all = await tx<StoredFollow[]>('follows', 'readonly', (s) => s.getAll());
  return all.filter((f) => f.targetId === targetId).length;
}
