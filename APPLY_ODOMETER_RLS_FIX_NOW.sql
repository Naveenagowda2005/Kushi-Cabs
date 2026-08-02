-- ============================================================
-- APPLY THIS NOW TO FIX ODOMETER IMAGE UPLOAD RLS ERROR
-- ============================================================
-- Error: "new row violates row-level security policy"
-- Cause: Overly restrictive RLS policies checking roles table
-- Solution: Simplified RLS policies
-- ============================================================

-- Step 1: Drop old restrictive policies
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;

-- Step 2: Create new simplified RLS policies
CREATE POLICY "Authenticated users can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'odometer-images'
  );

CREATE POLICY "Anyone can view odometer images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'odometer-images');

CREATE POLICY "Users can update their own odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'odometer-images'
    AND owner_id = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'odometer-images'
    AND owner_id = auth.uid()
  );

CREATE POLICY "Users can delete their own odometer images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'odometer-images'
    AND owner_id = auth.uid()
  );

-- Step 3: Verify policies
SELECT 
  policyname,
  operation,
  CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

SELECT '✅ Odometer RLS policies fixed - drivers can now upload images' AS status;
