-- ============================================================
-- COPY & PASTE THIS INTO SUPABASE SQL EDITOR
-- No modifications needed - just run it
-- ============================================================

-- Drop old policies that are blocking uploads
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;

-- Create new policies that work
CREATE POLICY "Authenticated users can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'odometer-images');

CREATE POLICY "Anyone can view odometer images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'odometer-images');

CREATE POLICY "Users can update their own odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'odometer-images' AND owner_id = auth.uid())
  WITH CHECK (bucket_id = 'odometer-images' AND owner_id = auth.uid());

CREATE POLICY "Users can delete their own odometer images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'odometer-images' AND owner_id = auth.uid());

-- Verification
SELECT 'Odometer RLS policies fixed' AS status;
