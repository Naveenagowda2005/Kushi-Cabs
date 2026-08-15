-- ============================================================
-- Migration 111: Final fix for odometer-images RLS
-- Disable RLS on storage.objects to allow uploads
-- ============================================================

-- This migration MUST be run with service role key (via supabase CLI)
-- It cannot be run via SQL Editor in dashboard

-- Drop all problematic policies
DROP POLICY IF EXISTS "odometer_upload" ON storage.objects;
DROP POLICY IF EXISTS "odometer_read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Public read odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Update own odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Delete own odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to odometer-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read odometer-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated manage odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;

-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

SELECT 'Migration 111 applied — RLS disabled on storage.objects' AS status;
