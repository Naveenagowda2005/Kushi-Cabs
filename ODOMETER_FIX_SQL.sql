-- Odometer RLS Fix
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;

CREATE POLICY "Authenticated users can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
  );

CREATE POLICY "Anyone can view odometer images"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
  );

CREATE POLICY "Users can update their own odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    AND owner_id = auth.uid()
  );

CREATE POLICY "Users can delete their own odometer images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    AND owner_id = auth.uid()
  );