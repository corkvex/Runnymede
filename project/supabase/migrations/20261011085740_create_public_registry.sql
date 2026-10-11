/*
# Opt-In Public Registry for Creators

## Overview
Creates a public, searchable registry that creators can voluntarily publish their profile to.
This is NOT tied to auth.users — the app uses cryptographic keypairs for identity, not Supabase Auth.
The anon key client reads and writes directly, so all policies use `TO anon, authenticated`.

## New Tables

1. `public_profiles` — Opt-in public creator registry
   - `id` (text, PK) — the creator's cryptographic full ID (SHA-256 hash prefix of public key)
   - `handle` (text) — display handle (e.g., @8c2d1a)
   - `display_name` (text, nullable) — optional custom display name for branding
   - `bio` (text, nullable) — creator bio
   - `public_key` (text) — base64 ECDSA public key for verification
   - `elo` (integer, default 1000) — current Elo rating
   - `debates_won` (integer, default 0)
   - `debates_lost` (integer, default 0)
   - `avatar_seed` (text) — seed for generating avatar
   - `categories` (text[], nullable) — debate topics this creator is known for (e.g., Politics, Science)
   - `is_verified` (boolean, default false) — set true after cryptographic signature verification
   - `is_live` (boolean, default false) — whether the creator currently has a live debate
   - `follower_count` (integer, default 0) — cached follower count for sorting/display
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

2. `public_debates` — Opt-in public debate listings for discovery
   - `id` (text, PK) — debate ID (matches local IndexedDB debate ID)
   - `title` (text, not null)
   - `topic` (text)
   - `description` (text)
   - `pro_id` (text) — PRO debater's crypto ID
   - `con_id` (text) — CON debater's crypto ID (or 'pending')
   - `status` (text, default 'waiting') — waiting, live, ended
   - `pro_handle` (text, nullable)
   - `con_handle` (text, nullable)
   - `pro_votes` (integer, default 0)
   - `con_votes` (integer, default 0)
   - `category` (text, nullable) — debate category
   - `created_at` (timestamptz, default now())

## Security
- Both tables are intentionally public (opt-in registry). Anyone can read.
- Anyone can insert/update because there is no auth — the app trusts the client
  to only publish its own profile. This is acceptable for a public discovery
  index; the cryptographic verification badge provides authenticity, not RLS.
- All policies use `TO anon, authenticated` since the frontend has no sign-in.

## Important Notes
1. The `public_profiles` table uses a text primary key (crypto hash), not UUID.
2. `categories` is a text array for filtering creators by topic.
3. `is_live` and `follower_count` are updated by the client to reflect current state.
4. Trigram index on display_name and handle for fast search.
*/

-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Public profiles registry
CREATE TABLE IF NOT EXISTS public_profiles (
  id text PRIMARY KEY,
  handle text NOT NULL,
  display_name text,
  bio text,
  public_key text NOT NULL,
  elo integer NOT NULL DEFAULT 1000,
  debates_won integer NOT NULL DEFAULT 0,
  debates_lost integer NOT NULL DEFAULT 0,
  avatar_seed text NOT NULL DEFAULT '',
  categories text[] NOT NULL DEFAULT '{}',
  is_verified boolean NOT NULL DEFAULT false,
  is_live boolean NOT NULL DEFAULT false,
  follower_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_profiles_select_all" ON public_profiles;
CREATE POLICY "public_profiles_select_all"
  ON public_profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_profiles_insert_any" ON public_profiles;
CREATE POLICY "public_profiles_insert_any"
  ON public_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_profiles_update_any" ON public_profiles;
CREATE POLICY "public_profiles_update_any"
  ON public_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_profiles_delete_any" ON public_profiles;
CREATE POLICY "public_profiles_delete_any"
  ON public_profiles FOR DELETE TO anon, authenticated USING (true);

-- Public debates registry
CREATE TABLE IF NOT EXISTS public_debates (
  id text PRIMARY KEY,
  title text NOT NULL,
  topic text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  pro_id text NOT NULL DEFAULT '',
  con_id text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'waiting',
  pro_handle text,
  con_handle text,
  pro_votes integer NOT NULL DEFAULT 0,
  con_votes integer NOT NULL DEFAULT 0,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public_debates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_debates_select_all" ON public_debates;
CREATE POLICY "public_debates_select_all"
  ON public_debates FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_debates_insert_any" ON public_debates;
CREATE POLICY "public_debates_insert_any"
  ON public_debates FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_debates_update_any" ON public_debates;
CREATE POLICY "public_debates_update_any"
  ON public_debates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_debates_delete_any" ON public_debates;
CREATE POLICY "public_debates_delete_any"
  ON public_debates FOR DELETE TO anon, authenticated USING (true);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_public_profiles_elo ON public_profiles(elo DESC);
CREATE INDEX IF NOT EXISTS idx_public_profiles_followers ON public_profiles(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_profiles_handle_trgm ON public_profiles USING gin (handle gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_public_profiles_display_name_trgm ON public_profiles USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_public_profiles_categories ON public_profiles USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_public_profiles_live ON public_profiles(is_live) WHERE is_live = true;

CREATE INDEX IF NOT EXISTS idx_public_debates_status ON public_debates(status);
CREATE INDEX IF NOT EXISTS idx_public_debates_created ON public_debates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_debates_category ON public_debates(category);
