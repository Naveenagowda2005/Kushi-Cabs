-- QUICK FIX: Temporarily disable RLS on trips table to diagnose issue
-- If trips appear after this, then RLS policies are the problem

-- Step 1: Disable RLS on trips table
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify it's disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'trips';

-- Step 3: Check all policies on trips are dropped (they're still there but won't be enforced)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'trips'
ORDER BY policyname;

-- After testing, if trips appear to driver, we know RLS was the issue.
-- Then we can re-enable RLS and fix the policies properly.
