-- ============================================================
-- DISABLE RLS ON STORAGE.OBJECTS TABLE
-- This removes ALL RLS restrictions - allows uploads
-- ============================================================

-- Step 1: Disable RLS completely
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

SELECT '✅ RLS disabled on storage.objects - all uploads should work now' AS status;
