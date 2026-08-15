-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Creates odometer-images storage bucket if it doesn't exist
-- ============================================================

-- Create the bucket (public so URLs are accessible without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'odometer-images',
  'odometer-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================
-- RLS Policies
-- ============================================================

-- Drivers can upload their own odometer images
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
CREATE POLICY "Drivers can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'odometer-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role_id = (SELECT id FROM public.roles WHERE name = 'driver')
    )
  );

-- Anyone authenticated can view odometer images (admins, vendors, drivers)
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
CREATE POLICY "Authenticated users can view odometer images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'odometer-images');

-- Drivers can update/replace their own images
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
CREATE POLICY "Drivers can update odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'odometer-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role_id = (SELECT id FROM public.roles WHERE name = 'driver')
    )
  );

SELECT 'Migration 109 applied — odometer-images bucket created' AS status;
