-- ============================================================
-- DISABLE RLS on vendor_documents and vendor_verification_status
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop ALL existing policies on vendor_documents
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'vendor_documents'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON vendor_documents', r.policyname);
  END LOOP;
END $$;

-- 2. Drop ALL existing policies on vendor_verification_status
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'vendor_verification_status'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON vendor_verification_status', r.policyname);
  END LOOP;
END $$;

-- 3. Disable RLS entirely on both tables
ALTER TABLE vendor_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_verification_status DISABLE ROW LEVEL SECURITY;

-- 4. Verify — should return 0 rows for both tables
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('vendor_documents', 'vendor_verification_status');

-- 5. Confirm RLS is disabled — rowsecurity should be FALSE for both
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('vendor_documents', 'vendor_verification_status');
