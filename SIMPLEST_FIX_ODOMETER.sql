-- ============================================================
-- SIMPLEST FIX: Remove all restrictive RLS policies
-- Just allow authenticated users to upload to odometer-images bucket
-- ============================================================

-- Step 1: Drop all existing odometer policies
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

-- Step 2: Create one simple policy - allow any authenticated user to upload
CREATE POLICY "odometer_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'odometer-images');

-- Step 3: Allow anyone to view
CREATE POLICY "odometer_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'odometer-images');

SELECT '✅ Odometer upload should now work for authenticated users' AS status;
