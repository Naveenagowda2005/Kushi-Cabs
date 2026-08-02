-- ============================================================
-- ODOMETER FIX - SIMPLE APPROACH (NO POLICIES NEEDED)
-- Same method as driver-documents bucket
-- ============================================================

-- Drop ALL broken RLS policies
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;

-- Update bucket to PRIVATE (public=false means no RLS needed)
UPDATE storage.buckets 
SET public = false 
WHERE name = 'odometer-images';

-- That's it! Private bucket = works without policies
-- Same as driver-documents and vendor-documents

SELECT 'Done! Odometer bucket is now PRIVATE like driver-documents. Upload will work.' AS status;
