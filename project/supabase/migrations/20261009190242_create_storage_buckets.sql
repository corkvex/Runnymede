/*
# Storage buckets for videos, thumbnails, avatars, and banners

## Changes
1. Inserts storage buckets for user-uploaded content: 'videos', 'thumbnails', 'avatars', 'banners'.
2. Creates storage policies so authenticated users can:
   - Read all media (public viewing)
   - Upload/update/delete only their own files (folder keyed by user id)

## Notes
- Storage policies use `storage.foldername()` to scope by user id subfolder.
- All buckets are public for read access.
*/

INSERT INTO storage.buckets (id, name, public) VALUES
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true),
  ('avatars', 'avatars', true),
  ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Videos bucket policies
DROP POLICY IF EXISTS "videos_read_all" ON storage.objects;
CREATE POLICY "videos_read_all" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "videos_insert_own" ON storage.objects;
CREATE POLICY "videos_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "videos_update_own" ON storage.objects;
CREATE POLICY "videos_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "videos_delete_own" ON storage.objects;
CREATE POLICY "videos_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Thumbnails bucket policies
DROP POLICY IF EXISTS "thumbnails_read_all" ON storage.objects;
CREATE POLICY "thumbnails_read_all" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "thumbnails_insert_own" ON storage.objects;
CREATE POLICY "thumbnails_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "thumbnails_update_own" ON storage.objects;
CREATE POLICY "thumbnails_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "thumbnails_delete_own" ON storage.objects;
CREATE POLICY "thumbnails_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars bucket policies
DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;
CREATE POLICY "avatars_read_all" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Banners bucket policies
DROP POLICY IF EXISTS "banners_read_all" ON storage.objects;
CREATE POLICY "banners_read_all" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_insert_own" ON storage.objects;
CREATE POLICY "banners_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "banners_update_own" ON storage.objects;
CREATE POLICY "banners_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "banners_delete_own" ON storage.objects;
CREATE POLICY "banners_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);
