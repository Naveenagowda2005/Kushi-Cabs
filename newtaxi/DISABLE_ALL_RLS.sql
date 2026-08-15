-- ============================================================================
-- DISABLE ALL ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================================
-- Run this script in Supabase SQL Editor to disable RLS on all tables
-- This allows unrestricted access to all data (use only for development/testing)
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE seater_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true 
ORDER BY tablename;

-- Expected output: Empty result set (no tables with RLS enabled)

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- ⚠️  RLS is now DISABLED on all tables
-- ⚠️  All users have unrestricted access to all data
-- ⚠️  USE ONLY FOR DEVELOPMENT/TESTING
-- ⚠️  RE-ENABLE RLS IN PRODUCTION!
-- ============================================================================

-- TO RE-ENABLE RLS LATER:
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- 
-- Or run the ENABLE_ALL_RLS.sql script when ready for production
-- ============================================================================
