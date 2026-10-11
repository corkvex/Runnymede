/*
# Increment video views function + auto-profile trigger

## Changes
1. Creates a SECURITY DEFINER function `increment_video_views` that atomically increments the view count of a video. This is callable by authenticated users because video views should be public-countable.
2. Creates a trigger `on_auth_user_created` that automatically inserts a row into `profiles` when a new user signs up via Supabase Auth, using their email as the default username (with a random suffix to ensure uniqueness).

## Security
- The increment function is SECURITY DEFINER so it can update the views column even though users don't have UPDATE permission on videos. It only increments, never decrements or sets arbitrary values.
- The trigger function is SECURITY DEFINER so it can insert into profiles even during the auth flow.
*/

-- Function to increment views atomically
CREATE OR REPLACE FUNCTION increment_video_views(video_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE videos SET views = views + 1 WHERE id = video_uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_video_views(uuid) TO authenticated;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      split_part(NEW.email, '@', 1),
      'user'
    ) || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
