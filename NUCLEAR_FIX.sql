-- STEP 1: See what policies actually exist (to get exact names)
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
AND (policyname ILIKE '%odometer%' OR policyname ILIKE '%upload%' OR policyname ILIKE '%view%');

-- STEP 2: Disable RLS completely on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
