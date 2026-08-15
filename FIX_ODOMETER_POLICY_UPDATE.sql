-- ============================================================
-- UPDATE EXISTING ODOMETER RLS POLICY TO BE LESS RESTRICTIVE
-- The new policy already exists but is still not working
-- We need to replace it with a simpler one
-- ============================================================

-- Drop all odometer-related policies
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;

-- Disable RLS temporarily to allow uploads
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Or create a simple policy that allows all authenticated users to upload
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated upload to odometer-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'odometer-images');

CREATE POLICY "Allow public read odometer-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'odometer-images');

CREATE POLICY "Allow authenticated manage odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'odometer-images');

CREATE POLICY "Allow authenticated delete odometer images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'odometer-images');

SELECT '✅ Odometer RLS policies updated - should now allow uploads' AS status;
