/*
# Add content_type to videos + Create debates schema

## Changes
1. Adds `content_type` column to `videos` table ('video', 'short', 'podcast'). Defaults to 'video'.
2. Creates `debates` table — organized debates with title, description, status, participants.
3. Creates `debate_participants` table — users participating in a debate with role (pro, con, moderator).
4. Creates `debate_messages` table — live messages/arguments during a debate.

## New Tables

1. `debates`
   - `id` (uuid, PK)
   - `host_id` (uuid, FK → profiles.id) — the debate creator
   - `title` (text, not null)
   - `description` (text, nullable)
   - `topic` (text, nullable) — the debate topic/question
   - `status` (text, default 'waiting') — waiting, live, ended
   - `created_at` (timestamptz)

2. `debate_participants`
   - `id` (uuid, PK)
   - `debate_id` (uuid, FK → debates.id, ON DELETE CASCADE)
   - `user_id` (uuid, FK → profiles.id)
   - `role` (text, not null) — 'pro', 'con', 'moderator'
   - `joined_at` (timestamptz, default now())
   - UNIQUE(debate_id, user_id)

3. `debate_messages`
   - `id` (uuid, PK)
   - `debate_id` (uuid, FK → debates.id, ON DELETE CASCADE)
   - `user_id` (uuid, FK → profiles.id)
   - `content` (text, not null)
   - `created_at` (timestamptz)

## Security
- All tables readable by authenticated users (debates are public to watch).
- Only debate host can update/delete the debate.
- Users join as participants themselves (insert their own row).
- Only debate participants can send messages during a debate.
- Host can remove participants (delete).
*/

-- Add content_type to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'video';
CREATE INDEX IF NOT EXISTS idx_videos_content_type ON videos(content_type);

-- Debates table
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  topic text,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debates_select_all" ON debates;
CREATE POLICY "debates_select_all"
  ON debates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "debates_insert_own" ON debates;
CREATE POLICY "debates_insert_own"
  ON debates FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "debates_update_own" ON debates;
CREATE POLICY "debates_update_own"
  ON debates FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "debates_delete_own" ON debates;
CREATE POLICY "debates_delete_own"
  ON debates FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Debate participants table
CREATE TABLE IF NOT EXISTS debate_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(debate_id, user_id)
);
ALTER TABLE debate_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debate_participants_select_all" ON debate_participants;
CREATE POLICY "debate_participants_select_all"
  ON debate_participants FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "debate_participants_insert_own" ON debate_participants;
CREATE POLICY "debate_participants_insert_own"
  ON debate_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debate_participants_delete_own_or_host" ON debate_participants;
CREATE POLICY "debate_participants_delete_own_or_host"
  ON debate_participants FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM debates WHERE debates.id = debate_participants.debate_id AND debates.host_id = auth.uid()));

-- Debate messages table
CREATE TABLE IF NOT EXISTS debate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debate_messages_select_all" ON debate_messages;
CREATE POLICY "debate_messages_select_all"
  ON debate_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "debate_messages_insert_participants" ON debate_messages;
CREATE POLICY "debate_messages_insert_participants"
  ON debate_messages FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM debate_participants WHERE debate_participants.debate_id = debate_messages.debate_id AND debate_participants.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_created ON debates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debate_participants_debate ON debate_participants(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_debate ON debate_messages(debate_id);
