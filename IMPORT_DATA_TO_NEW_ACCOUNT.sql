-- ============================================================
-- IMPORT DATA TO NEW SUPABASE ACCOUNT
-- ============================================================
-- Run this in: https://cqfsirfjwfxvwggjkrvd.supabase.co (NEW Account)
-- SQL Editor → New Query
-- IMPORTANT: Replace the VALUES with actual data from export
-- ============================================================

-- ============================================================
-- PRE-IMPORT: Disable triggers and checks for speed
-- ============================================================
ALTER TABLE wallets DISABLE TRIGGER ALL;
ALTER TABLE trips DISABLE TRIGGER ALL;
ALTER TABLE payment_orders DISABLE TRIGGER ALL;
ALTER TABLE transactions DISABLE TRIGGER ALL;
ALTER TABLE driver_documents DISABLE TRIGGER ALL;
ALTER TABLE vendor_documents DISABLE TRIGGER ALL;

-- ============================================================
-- STEP 1: Import Reference Data (No Dependencies)
-- ============================================================

-- Car Types
TRUNCATE TABLE car_types RESTART IDENTITY CASCADE;
INSERT INTO car_types (id, name, description, created_at)
VALUES 
  -- Paste data from export here
  -- Example: (1, 'Sedan', 'Standard sedan car', now())
ON CONFLICT DO NOTHING;

-- Seater Types
TRUNCATE TABLE seater_types RESTART IDENTITY CASCADE;
INSERT INTO seater_types (id, name, capacity, created_at)
VALUES 
  -- Paste data from export here
ON CONFLICT DO NOTHING;

-- Fuel Types
TRUNCATE TABLE fuel_types RESTART IDENTITY CASCADE;
INSERT INTO fuel_types (id, name, created_at)
VALUES 
  -- Paste data from export here
ON CONFLICT DO NOTHING;

-- Trip Packages
TRUNCATE TABLE trip_packages RESTART IDENTITY CASCADE;
INSERT INTO trip_packages (id, name, description, base_km, base_price, per_km_charge, created_at)
VALUES 
  -- Paste data from export here
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 2: Import Settings (No Dependencies)
-- ============================================================

-- App Settings
TRUNCATE TABLE app_settings RESTART IDENTITY CASCADE;
INSERT INTO app_settings (id, setting_key, setting_value, created_at)
VALUES 
  -- Paste data from export here
ON CONFLICT DO NOTHING;

-- App Policies
TRUNCATE TABLE app_policies RESTART IDENTITY CASCADE;
INSERT INTO app_policies (id, policy_name, policy_content, created_at)
VALUES 
  -- Paste data from export here
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 3: Import Users (CRITICAL - Required for everything)
-- ============================================================

TRUNCATE TABLE users RESTART IDENTITY CASCADE;
INSERT INTO users (
  id, phone, name, role, email, is_verified, verification_status, 
  is_active, created_at, updated_at
)
VALUES 
  -- Paste all user records from export here
  -- IMPORTANT: Preserve original UUIDs and timestamps
  -- Example: ('uuid-1', '9123456789', 'John Doe', 'user_id', 'john@example.com', true, 'approved', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 4: Import Vendors (Depends on users)
-- ============================================================

INSERT INTO vendors (
  id, user_id, company_name, registration_number, gst_number, 
  bank_details, average_rating, status, is_verified, 
  verification_status, created_at, updated_at
)
VALUES 
  -- Paste vendor records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Import Drivers (Depends on users)
-- ============================================================

INSERT INTO drivers (
  id, user_id, license_number, license_expiry, average_rating, 
  is_verified, verification_status, status, created_at, updated_at
)
VALUES 
  -- Paste driver records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 6: Import Verification Status
-- ============================================================

INSERT INTO driver_verification_status (
  id, driver_id, status, verified_at, created_at
)
VALUES 
  -- Paste records from export
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendor_verification_status (
  id, vendor_id, status, verified_at, created_at
)
VALUES 
  -- Paste records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 7: Import Trips (Most complex - depends on many tables)
-- ============================================================

INSERT INTO trips (
  id, vendor_id, driver_id, customer_phone, customer_name,
  pickup_location, dropoff_location, trip_status,
  base_fare, distance_km, duration_minutes, commission,
  car_type_id, fuel_type_id, is_published, created_at, updated_at
)
VALUES 
  -- Paste trip records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 8: Import Trip Segments (Depends on trips)
-- ============================================================

INSERT INTO trip_segments (
  id, trip_id, segment_number, pickup_location, dropoff_location, 
  distance_km, duration_minutes, created_at
)
VALUES 
  -- Paste records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 9: Import Wallets (Depends on users/vendors/drivers)
-- ============================================================

INSERT INTO wallets (
  id, user_id, user_type, balance, total_earned, total_spent,
  minimum_balance, created_at, updated_at
)
VALUES 
  -- Paste wallet records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 10: Import Transactions (Depends on wallets)
-- ============================================================

INSERT INTO transactions (
  id, wallet_id, transaction_type, amount, description,
  reference_id, created_at
)
VALUES 
  -- Paste transaction records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 11: Import Payment Orders (Depends on transactions)
-- ============================================================

INSERT INTO payment_orders (
  id, user_id, amount, payment_gateway, payment_status,
  transaction_id, created_at, updated_at
)
VALUES 
  -- Paste payment order records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 12: Import Documents
-- ============================================================

INSERT INTO documents (
  id, document_type, document_number, issue_date, expiry_date,
  created_at, updated_at
)
VALUES 
  -- Paste document records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 13: Import Driver Documents (Depends on drivers, documents)
-- ============================================================

INSERT INTO driver_documents (
  id, driver_id, document_id, status, verified_at,
  created_at, updated_at
)
VALUES 
  -- Paste records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 14: Import Vendor Documents (Depends on vendors, documents)
-- ============================================================

INSERT INTO vendor_documents (
  id, vendor_id, document_id, status, verified_at,
  created_at, updated_at
)
VALUES 
  -- Paste records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 15: Import Active Sessions (Depends on users)
-- ============================================================

INSERT INTO active_sessions (
  id, user_id, session_token, login_time, last_activity,
  created_at
)
VALUES 
  -- Paste records from export
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POST-IMPORT: Re-enable all triggers
-- ============================================================

ALTER TABLE wallets ENABLE TRIGGER ALL;
ALTER TABLE trips ENABLE TRIGGER ALL;
ALTER TABLE payment_orders ENABLE TRIGGER ALL;
ALTER TABLE transactions ENABLE TRIGGER ALL;
ALTER TABLE driver_documents ENABLE TRIGGER ALL;
ALTER TABLE vendor_documents ENABLE TRIGGER ALL;

-- ============================================================
-- VERIFICATION: Count imported data
-- ============================================================

SELECT 'DATA COUNT AFTER IMPORT' as "=== NEW ACCOUNT ===" UNION ALL
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
-- VERIFY DATA INTEGRITY
-- ============================================================

SELECT 'INTEGRITY CHECKS' as "=== Verify Relationships ===" UNION ALL
SELECT '━━━━━━━━━━━━━━━━━━━━━━━' as col UNION ALL
SELECT 'Vendors with invalid user_id: ' || COUNT(*)::TEXT 
  FROM vendors WHERE user_id NOT IN (SELECT id FROM users) UNION ALL
SELECT 'Drivers with invalid user_id: ' || COUNT(*)::TEXT 
  FROM drivers WHERE user_id NOT IN (SELECT id FROM users) UNION ALL
SELECT 'Trips with invalid vendor_id: ' || COUNT(*)::TEXT 
  FROM trips WHERE vendor_id IS NOT NULL AND vendor_id NOT IN (SELECT id FROM vendors) UNION ALL
SELECT 'Trips with invalid driver_id: ' || COUNT(*)::TEXT 
  FROM trips WHERE driver_id IS NOT NULL AND driver_id NOT IN (SELECT id FROM drivers) UNION ALL
SELECT 'Wallets with invalid user_id: ' || COUNT(*)::TEXT 
  FROM wallets WHERE user_id NOT IN (SELECT id FROM users);

-- ============================================================
-- IF EVERYTHING LOOKS GOOD:
-- ============================================================
/*
NEXT STEPS:
1. ✅ Verify counts match between OLD and NEW accounts
2. ✅ Check integrity - should show 0 invalid references
3. ✅ Test app connections work
4. ✅ Run full app testing with migrated data
5. ✅ Keep OLD account as backup for 30 days
6. ✅ Document any manual fixes needed

If you see invalid references, you need to:
- Check export for NULL values in foreign keys
- Verify referenced records were imported
- Fix manually or reimport with corrections
*/
