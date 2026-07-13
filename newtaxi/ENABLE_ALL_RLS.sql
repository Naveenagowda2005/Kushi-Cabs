-- ============================================================================
-- ENABLE ALL ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================================
-- Run this script in Supabase SQL Editor to re-enable RLS on all tables
-- Use this when transitioning from development to production
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE seater_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Expected output: All public tables should have rowsecurity = true

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- ✅ RLS is now ENABLED on all tables
-- ✅ Access control policies are active
-- ✅ Data is protected based on RLS policies
-- ✅ Ready for production use
-- ============================================================================

-- TO DISABLE RLS AGAIN (for development):
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- 
-- Or run the DISABLE_ALL_RLS.sql script
-- ============================================================================
