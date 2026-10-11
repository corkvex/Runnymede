/**
 * Public registry client — Supabase-backed opt-in discovery index.
 * Creators publish their profile here so others can find them by name,
 * category, or trending. No auth required; the anon key is used directly.
 */

import { createClient } from '@supabase/supabase-js';
import type { StoredProfile } from './storage';
import { getRankFromElo } from './elo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PublicProfile {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  public_key: string;
  elo: number;
  debates_won: number;
  debates_lost: number;
  avatar_seed: string;
  avatar_url: string | null;
  categories: string[];
  is_verified: boolean;
  is_live: boolean;
  follower_count: number;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicDebate {
  id: string;
  title: string;
  topic: string;
  description: string;
  pro_id: string;
  con_id: string;
  status: string;
  pro_handle: string | null;
  con_handle: string | null;
  pro_votes: number;
  con_votes: number;
  category: string | null;
  created_at: string;
}

export const DEBATE_CATEGORIES = [
  'Politics',
  'Science',
  'Philosophy',
  'Economics',
  'Technology',
  'Religion',
  'Sports',
  'Culture',
  'History',
  'Law',
] as const;

export type DebateCategory = typeof DEBATE_CATEGORIES[number];

export const DEBATE_REGIONS = [
  'North America',
  'Europe',
  'Asia',
  'South America',
  'Africa',
  'Oceania',
] as const;

export type DebateRegion = typeof DEBATE_REGIONS[number];

/** Publish (or update) a profile in the public registry. */
export async function publishProfile(
  profile: StoredProfile,
  displayName: string,
  categories: string[],
  region?: string | null,
): Promise<PublicProfile | null> {
  const row = {
    id: profile.id,
    handle: profile.handle,
    display_name: displayName || null,
    bio: profile.bio,
    public_key: profile.publicKey,
    elo: profile.elo,
    debates_won: profile.debatesWon,
    debates_lost: profile.debatesLost,
    avatar_seed: profile.avatarSeed || profile.handle,
    categories,
    region: region || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('public_profiles')
    .upsert(row)
    .select()
    .maybeSingle();

  if (error) {
    console.error('publishProfile error:', error);
    return null;
  }
  return data as PublicProfile | null;
}

/** Remove a profile from the public registry (un-publish). */
export async function unpublishProfile(id: string): Promise<boolean> {
  const { error } = await supabase.from('public_profiles').delete().eq('id', id);
  if (error) {
    console.error('unpublishProfile error:', error);
    return false;
  }
  return true;
}

/** Check if a profile is currently published. */
export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('getPublicProfile error:', error);
    return null;
  }
  return data as PublicProfile | null;
}

/** Search public profiles by display name, handle, or bio. */
export async function searchPublicProfiles(query: string): Promise<PublicProfile[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .or(`display_name.ilike.%${query}%,handle.ilike.%${query}%,bio.ilike.%${query}%`)
    .order('elo', { ascending: false })
    .limit(20);

  if (error) {
    console.error('searchPublicProfiles error:', error);
    return [];
  }
  return (data || []) as PublicProfile[];
}

/** Get top creators by Elo, optionally filtered by category. */
export async function getTopCreators(category?: string, limit = 20): Promise<PublicProfile[]> {
  let query = supabase
    .from('public_profiles')
    .select('*')
    .order('elo', { ascending: false })
    .limit(limit);

  if (category) {
    query = query.contains('categories', [category]);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getTopCreators error:', error);
    return [];
  }
  return (data || []) as PublicProfile[];
}

/** Get creators currently marked as live. */
export async function getLiveCreators(): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('is_live', true)
    .order('follower_count', { ascending: false });

  if (error) {
    console.error('getLiveCreators error:', error);
    return [];
  }
  return (data || []) as PublicProfile[];
}

/** Get all public creators ordered by Elo (for global rankings). */
export async function getAllPublicCreators(limit = 100): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .order('elo', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getAllPublicCreators error:', error);
    return [];
  }
  return (data || []) as PublicProfile[];
}

/** Get public creators filtered by region, ordered by Elo. */
export async function getCreatorsByRegion(region: string, limit = 50): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('region', region)
    .order('elo', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getCreatorsByRegion error:', error);
    return [];
  }
  return (data || []) as PublicProfile[];
}

/** Get trending creators (most followers, recently active). */
export async function getTrendingCreators(limit = 12): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .order('follower_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getTrendingCreators error:', error);
    return [];
  }
  return (data || []) as PublicProfile[];
}

/** Get public/live debates for discovery. */
export async function getPublicDebates(status?: string): Promise<PublicDebate[]> {
  let query = supabase
    .from('public_debates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getPublicDebates error:', error);
    return [];
  }
  return (data || []) as PublicDebate[];
}

/** Publish a debate to the public registry for discovery. */
export async function publishDebate(
  debate: {
    id: string;
    title: string;
    topic: string;
    description: string;
    proId: string;
    conId: string;
    status: string;
    proHandle?: string;
    conHandle?: string;
    proVotes: number;
    conVotes: number;
    category?: string;
  },
): Promise<boolean> {
  const row = {
    id: debate.id,
    title: debate.title,
    topic: debate.topic,
    description: debate.description,
    pro_id: debate.proId,
    con_id: debate.conId,
    status: debate.status,
    pro_handle: debate.proHandle || null,
    con_handle: debate.conHandle || null,
    pro_votes: debate.proVotes,
    con_votes: debate.conVotes,
    category: debate.category || null,
  };

  const { error } = await supabase.from('public_debates').upsert(row);
  if (error) {
    console.error('publishDebate error:', error);
    return false;
  }
  return true;
}

/** Update a creator's live status in the registry. */
export async function setLiveStatus(id: string, isLive: boolean): Promise<void> {
  await supabase
    .from('public_profiles')
    .update({ is_live: isLive, updated_at: new Date().toISOString() })
    .eq('id', id);
}

/** Update a published creator's Elo and W/L stats in the public registry. */
export async function updatePublishedStats(
  id: string,
  elo: number,
  debatesWon: number,
  debatesLost: number,
): Promise<boolean> {
  const { error } = await supabase
    .from('public_profiles')
    .update({
      elo,
      debates_won: debatesWon,
      debates_lost: debatesLost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    console.error('updatePublishedStats error:', error);
    return false;
  }
  return true;
}

/** Convert a PublicProfile to a StoredProfile for local use. */
export function publicToLocal(pub: PublicProfile): StoredProfile {
  return {
    id: pub.id,
    handle: pub.handle,
    publicKey: pub.public_key,
    elo: pub.elo,
    debatesWon: pub.debates_won,
    debatesLost: pub.debates_lost,
    bio: pub.bio || 'A voice on the Runnymede floor.',
    avatarSeed: pub.avatar_seed || pub.handle,
    createdAt: new Date(pub.created_at).getTime(),
  };
}

/** Get the display name for a public profile (falls back to handle). */
export function getDisplayName(pub: PublicProfile): string {
  return pub.display_name || pub.handle;
}

/** Get rank info for a public profile. */
export function getPublicRank(pub: PublicProfile) {
  return getRankFromElo(pub.elo, pub.debates_won + pub.debates_lost);
}
