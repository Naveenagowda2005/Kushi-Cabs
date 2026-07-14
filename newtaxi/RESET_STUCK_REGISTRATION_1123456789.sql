-- ============================================================
-- RESET STUCK REGISTRATION FOR: 1123456789
-- ============================================================
-- This script safely removes partial/stuck registration data and allows re-registration
-- IMPORTANT: Run diagnostic first to confirm what data exists

BEGIN;

-- Step 1: Disable constraints temporarily to clean up
ALTER TABLE drivers DISABLE TRIGGER ALL;
ALTER TABLE vendors DISABLE TRIGGER ALL;
ALTER TABLE wallets DISABLE TRIGGER ALL;
ALTER TABLE documents DISABLE TRIGGER ALL;
ALTER TABLE transactions DISABLE TRIGGER ALL;
ALTER TABLE trips DISABLE TRIGGER ALL;

-- Step 2: Delete related records (cascade will handle some, but be explicit to avoid orphans)
DELETE FROM active_sessions 
WHERE user_id IN (SELECT id FROM users WHERE phone = '1123456789');

DELETE FROM driver_verification 
WHERE user_id IN (SELECT id FROM users WHERE phone = '1123456789');

DELETE FROM documents 
WHERE user_id IN (SELECT id FROM users WHERE phone = '1123456789');

DELETE FROM transactions 
WHERE wallet_id IN (
  SELECT id FROM wallets WHERE user_id IN (
    SELECT id FROM users WHERE phone = '1123456789'
  )
);

DELETE FROM wallets 
WHERE user_id IN (SELECT id FROM users WHERE phone = '1123456789');

DELETE FROM drivers 
WHERE user_id IN (SELECT id FROM users WHERE phone = '1123456789');

DELETE FROM vendors 
WHERE user_id IN (SELECT id FROM users WHERE phone = '1123456789');

DELETE FROM users 
WHERE phone = '1123456789';

-- Step 3: Re-enable constraints
ALTER TABLE drivers ENABLE TRIGGER ALL;
ALTER TABLE vendors ENABLE TRIGGER ALL;
ALTER TABLE wallets ENABLE TRIGGER ALL;
ALTER TABLE documents ENABLE TRIGGER ALL;
ALTER TABLE transactions ENABLE TRIGGER ALL;
ALTER TABLE trips ENABLE TRIGGER ALL;

-- Step 4: Verify cleanup
SELECT 'Users table after cleanup:' AS status;
SELECT COUNT(*) as remaining_users FROM users WHERE phone = '1123456789';

SELECT 'Drivers table after cleanup:' AS status;
SELECT COUNT(*) as remaining_drivers FROM drivers WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

SELECT 'Vendors table after cleanup:' AS status;
SELECT COUNT(*) as remaining_vendors FROM vendors WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

SELECT 'Wallets table after cleanup:' AS status;
SELECT COUNT(*) as remaining_wallets FROM wallets WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

-- If all counts are 0, commit the transaction
-- If any count is > 0, check for orphaned records
COMMIT;

-- ============================================================
-- IMPORTANT: Auth user cleanup
-- ============================================================
-- NOTE: You CANNOT delete auth.users directly from SQL
-- The auth.users table is managed by Supabase Auth and can only be deleted:
-- 1. Through Supabase Dashboard (Auth > Users)
-- 2. Or through Supabase Admin API
-- 
-- To delete the auth user for 1123456789@kushicabs.phone:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication > Users
-- 3. Search for "1123456789@kushicabs.phone"
-- 4. Click the user and select "Delete User"
--
-- After deleting the auth user, the phone number will be available for re-registration
-- ============================================================
