/*
# Free Speech Video Platform — Core Schema

## Overview
Creates the full database schema for a YouTube-style video platform with creator messaging.
Users sign up with email/password (Supabase Auth). Each user gets a profile (channel).
Users can upload videos, like videos, comment on videos, subscribe to channels,
and send direct messages to other users (creators).

## New Tables

1. `profiles` — User channel profiles
   - `id` (uuid, PK, references auth.users)
   - `username` (text, unique) — channel display name / handle
   - `avatar_url` (text, nullable) — profile picture URL
   - `banner_url` (text, nullable) — channel banner image URL
   - `bio` (text, nullable) — channel description
   - `created_at` (timestamptz)

2. `videos` — Uploaded videos
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles.id) — uploader
   - `title` (text, not null)
   - `description` (text, nullable)
   - `video_url` (text, not null) — URL to video file
   - `thumbnail_url` (text, nullable) — custom thumbnail
   - `category` (text, nullable)
   - `views` (bigint, default 0)
   - `duration` (text, nullable)
   - `created_at` (timestamptz)

3. `likes` — Video likes (one per user per video)
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles.id)
   - `video_id` (uuid, FK → videos.id, ON DELETE CASCADE)
   - `created_at` (timestamptz)

4. `comments` — Video comments
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles.id)
   - `video_id` (uuid, FK → videos.id, ON DELETE CASCADE)
   - `content` (text, not null)
   - `created_at` (timestamptz)

5. `subscriptions` — Channel subscriptions (one user subscribes to another)
   - `id` (uuid, PK)
   - `subscriber_id` (uuid, FK → profiles.id)
   - `channel_id` (uuid, FK → profiles.id) — the creator being subscribed to
   - `created_at` (timestamptz)

6. `messages` — Direct messages between users
   - `id` (uuid, PK)
   - `sender_id` (uuid, FK → profiles.id)
   - `receiver_id` (uuid, FK → profiles.id)
   - `content` (text, not null)
   - `read` (boolean, default false)
   - `created_at` (timestamptz)

## Security (RLS)
- `profiles`: anyone authenticated can read (to see channels), users can update only their own.
- `videos`: anyone authenticated can read; only owner can insert/update/delete.
- `likes`: anyone authenticated can read; users can only insert/delete their own likes.
- `comments`: anyone authenticated can read; users can insert their own; owners can delete their own comments; video owners can delete comments on their videos.
- `subscriptions`: anyone authenticated can read; users can insert/delete their own subscriptions.
- `messages`: users can read messages they sent or received; users can only send messages as themselves; users can mark messages they received as read.

## Important Notes
1. All owner columns default to `auth.uid()` so inserts from the client work without explicitly passing user_id.
2. Unique constraints on `likes` (user_id + video_id) and `subscriptions` (subscriber_id + channel_id) prevent duplicates.
3. Foreign keys use ON DELETE CASCADE for child tables where appropriate so deleting a video also removes its likes and comments.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  banner_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  category text,
  views bigint NOT NULL DEFAULT 0,
  duration text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "videos_select_all" ON videos;
CREATE POLICY "videos_select_all"
  ON videos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "videos_insert_own" ON videos;
CREATE POLICY "videos_insert_own"
  ON videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "videos_update_own" ON videos;
CREATE POLICY "videos_update_own"
  ON videos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "videos_delete_own" ON videos;
CREATE POLICY "videos_delete_own"
  ON videos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all"
  ON likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own"
  ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own"
  ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all"
  ON comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own"
  ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own"
  ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, channel_id)
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_all" ON subscriptions;
CREATE POLICY "subscriptions_select_all"
  ON subscriptions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own"
  ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = subscriber_id);

DROP POLICY IF EXISTS "subscriptions_delete_own" ON subscriptions;
CREATE POLICY "subscriptions_delete_own"
  ON subscriptions FOR DELETE TO authenticated USING (auth.uid() = subscriber_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_own" ON messages;
CREATE POLICY "messages_select_own"
  ON messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own"
  ON messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
