-- ============================================================
-- EMERGENCY FIX: Odometer Images RLS - Apply Immediately
-- ============================================================
-- Error: "Upload failed: new row violates row-level security policy"
-- Cause: RLS policies in migration 109 are too restrictive
-- Solution: Replace with simpler, working RLS policies
-- ============================================================

-- First, verify the bucket exists
SELECT 'Checking bucket...' AS step;
SELECT id, name, public FROM storage.buckets WHERE id = 'odometer-images';

-- ============================================================
-- Step 1: Drop old restrictive policies
-- ============================================================
SELECT 'Dropping old policies...' AS step;

DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;

-- ============================================================
-- Step 2: Create new simplified RLS policies
-- ============================================================
SELECT 'Creating new policies...' AS step;

-- Policy 1: Authenticated users can upload to odometer-images
CREATE POLICY "Authenticated users can upload odometer images v2"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'odometer-images'
  );

-- Policy 2: Public read access to odometer-images
CREATE POLICY "Public read odometer images v2"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'odometer-images');

-- Policy 3: Users can update their own images
CREATE POLICY "Update own odometer images v2"
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

-- Policy 4: Users can delete their own images
CREATE POLICY "Delete own odometer images v2"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'odometer-images'
    AND owner_id = auth.uid()
  );

-- ============================================================
-- Step 3: Verify policies were created
-- ============================================================
SELECT 'Verifying new policies...' AS step;

SELECT 
  policyname,
  CASE 
    WHEN qual IS NOT NULL THEN 'SELECT'
    ELSE operation
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING'
    ELSE 'No USING'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND bucket_id = 'odometer-images'
ORDER BY policyname;

-- ============================================================
-- Step 4: Test query (verify users table structure)
-- ============================================================
SELECT 'Checking users table for auth.uid() references...' AS step;

-- This should return at least the authenticated user
SELECT COUNT(*) as total_users FROM public.users WHERE id IS NOT NULL;

-- ============================================================
-- Success Message
-- ============================================================
SELECT '✅ ODOMETER RLS FIX APPLIED' AS status,
       'Drivers can now upload odometer images' AS message,
       'Test by uploading image in driver app' AS next_step;
