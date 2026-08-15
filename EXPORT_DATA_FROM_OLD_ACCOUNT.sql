-- ============================================================
-- EXPORT DATA FROM OLD SUPABASE ACCOUNT
-- ============================================================
-- Run this in: https://vofupwsnbcidjnifaihm.supabase.co (OLD Account)
-- SQL Editor → New Query → Copy all below → Run
-- Then copy results and use in import script
-- ============================================================

-- Count check before export
SELECT 'DATA COUNT BEFORE EXPORT' as "=== OLD ACCOUNT ===" UNION ALL
SELECT '━━━━━━━━━━━━━━━━━━━━━━━' as col UNION ALL
SELECT 'Users: ' || COUNT(*)::TEXT FROM users UNION ALL
SELECT 'Vendors: ' || COUNT(*)::TEXT FROM vendors UNION ALL
SELECT 'Drivers: ' || COUNT(*)::TEXT FROM drivers UNION ALL
SELECT 'Trips: ' || COUNT(*)::TEXT FROM trips UNION ALL
SELECT 'Wallets: ' || COUNT(*)::TEXT FROM wallets UNION ALL
SELECT 'Transactions: ' || COUNT(*)::TEXT FROM transactions UNION ALL
SELECT 'Payment Orders: ' || COUNT(*)::TEXT FROM payment_orders UNION ALL
SELECT 'Trip Segments: ' || COUNT(*)::TEXT FROM trip_segments UNION ALL
SELECT 'Trip Packages: ' || COUNT(*)::TEXT FROM trip_packages UNION ALL
SELECT 'Documents: ' || COUNT(*)::TEXT FROM documents UNION ALL
SELECT 'Driver Documents: ' || COUNT(*)::TEXT FROM driver_documents UNION ALL
SELECT 'Vendor Documents: ' || COUNT(*)::TEXT FROM vendor_documents UNION ALL
SELECT 'Active Sessions: ' || COUNT(*)::TEXT FROM active_sessions;

-- ============================================================
-- EXPORT: Users (CRITICAL - Required for all other tables)
-- ============================================================
SELECT 'USERS:' as "Table";
SELECT * FROM users;

-- ============================================================
-- EXPORT: Vendors
-- ============================================================
SELECT 'VENDORS:' as "Table";
SELECT * FROM vendors;

-- ============================================================
-- EXPORT: Drivers
-- ============================================================
SELECT 'DRIVERS:' as "Table";
SELECT * FROM drivers;

-- ============================================================
-- EXPORT: Trips
-- ============================================================
SELECT 'TRIPS:' as "Table";
SELECT * FROM trips;

-- ============================================================
-- EXPORT: Wallets
-- ============================================================
SELECT 'WALLETS:' as "Table";
SELECT * FROM wallets;

-- ============================================================
-- EXPORT: Transactions
-- ============================================================
SELECT 'TRANSACTIONS:' as "Table";
SELECT * FROM transactions;

-- ============================================================
-- EXPORT: Payment Orders
-- ============================================================
SELECT 'PAYMENT_ORDERS:' as "Table";
SELECT * FROM payment_orders;

-- ============================================================
-- EXPORT: Trip Segments
-- ============================================================
SELECT 'TRIP_SEGMENTS:' as "Table";
SELECT * FROM trip_segments;

-- ============================================================
-- EXPORT: Trip Packages
-- ============================================================
SELECT 'TRIP_PACKAGES:' as "Table";
SELECT * FROM trip_packages;

-- ============================================================
-- EXPORT: Documents
-- ============================================================
SELECT 'DOCUMENTS:' as "Table";
SELECT * FROM documents;

-- ============================================================
-- EXPORT: Driver Documents
-- ============================================================
SELECT 'DRIVER_DOCUMENTS:' as "Table";
SELECT * FROM driver_documents;

-- ============================================================
-- EXPORT: Vendor Documents
-- ============================================================
SELECT 'VENDOR_DOCUMENTS:' as "Table";
SELECT * FROM vendor_documents;

-- ============================================================
-- EXPORT: Active Sessions
-- ============================================================
SELECT 'ACTIVE_SESSIONS:' as "Table";
SELECT * FROM active_sessions;

-- ============================================================
-- EXPORT: Reference Data (Car Types, Seater Types, Fuel Types)
-- ============================================================
SELECT 'CAR_TYPES:' as "Table";
SELECT * FROM car_types;

SELECT 'SEATER_TYPES:' as "Table";
SELECT * FROM seater_types;

SELECT 'FUEL_TYPES:' as "Table";
SELECT * FROM fuel_types;

-- ============================================================
-- EXPORT: Settings
-- ============================================================
SELECT 'APP_SETTINGS:' as "Table";
SELECT * FROM app_settings;

SELECT 'APP_POLICIES:' as "Table";
SELECT * FROM app_policies;

-- ============================================================
-- EXPORT: Verification Status
-- ============================================================
SELECT 'DRIVER_VERIFICATION_STATUS:' as "Table";
SELECT * FROM driver_verification_status;

SELECT 'VENDOR_VERIFICATION_STATUS:' as "Table";
SELECT * FROM vendor_verification_status;

-- ============================================================
-- INSTRUCTIONS FOR NEXT STEPS
-- ============================================================
/*
INSTRUCTIONS:
1. Run this entire script in OLD account SQL Editor
2. Copy all results to a text file
3. Go to: https://cqfsirfjwfxvwggjkrvd.supabase.co (NEW account)
4. Run the IMPORT script there
5. Verify counts match with verification query

IMPORTANT - Table Import Order:
1. Reference data: car_types, seater_types, fuel_types, trip_packages
2. Settings: app_settings, app_policies, roles
3. Users: users (PRIMARY - required for all)
4. Vendors: vendors (depends on users)
5. Drivers: drivers (depends on users)
6. Verification Status: driver_verification_status, vendor_verification_status
7. Trips: trips (depends on vendors, drivers, car_types, etc)
8. Trip Segments: trip_segments (depends on trips)
9. Wallets: wallets (depends on users/vendors/drivers)
10. Transactions: transactions (depends on wallets)
11. Payment Orders: payment_orders (depends on transactions)
12. Documents: documents
13. Driver Documents: driver_documents (depends on drivers, documents)
14. Vendor Documents: vendor_documents (depends on vendors, documents)
15. Active Sessions: active_sessions (depends on users)

NEXT: Use the IMPORT_DATA_TO_NEW_ACCOUNT.sql script
*/
