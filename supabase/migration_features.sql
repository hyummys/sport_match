-- ============================================
-- SportMatch Feature Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add view_count column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 2. Create index on view_count for sorting
CREATE INDEX IF NOT EXISTS idx_rooms_view_count ON rooms (view_count DESC);

-- 3. RPC function: atomic increment of view_count
CREATE OR REPLACE FUNCTION increment_view_count(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE rooms SET view_count = view_count + 1 WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create avatars storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies for avatars bucket
DO $$ BEGIN
  -- Allow authenticated users to upload their own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Avatar upload' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Avatar upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  -- Allow users to update their own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Avatar update' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Avatar update" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  -- Allow public read access to avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Avatar public read' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Avatar public read" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;
