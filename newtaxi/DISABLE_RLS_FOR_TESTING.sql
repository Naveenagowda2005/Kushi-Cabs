-- ============================================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Disable RLS on all tables to allow the Super Admin app to read data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'vendors', 'drivers', 'trips', 'wallets', 'transactions');

-- ============================================================
-- NOTE: This is for testing only!
-- In production, you should create proper RLS policies instead
-- ============================================================