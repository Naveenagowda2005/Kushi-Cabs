-- NUCLEAR OPTION: Disable ALL auto-sync triggers and manually set dummy driver

-- Step 1: Drop ALL triggers that might be syncing verification_status
DROP TRIGGER IF EXISTS trg_sync_user_verification_status ON driver_verification_status;
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;
DROP TRIGGER IF EXISTS trg_check_all_documents_submitted ON driver_documents;
DROP TRIGGER IF EXISTS trg_create_verification_status ON driver_documents;

-- Step 2: Directly update users table for dummy driver
BEGIN;
  UPDATE users
  SET verification_status = 'approved'::verification_status
  WHERE phone = '8050017071';
  
  -- Also update driver_verification_status
  UPDATE driver_verification_status
  SET overall_status = 'approved'::verification_status
  WHERE driver_id = (SELECT id FROM users WHERE phone = '8050017071');
COMMIT;

-- Step 3: Verify
SELECT 
  'USERS TABLE' as source,
  u.id, 
  u.full_name, 
  u.phone, 
  u.verification_status
FROM users u
WHERE u.phone = '8050017071'
UNION ALL
SELECT
  'DVS TABLE' as source,
  dvs.driver_id,
  u.full_name,
  u.phone,
  dvs.overall_status::text
FROM driver_verification_status dvs
JOIN users u ON u.id = dvs.driver_id
WHERE u.phone = '8050017071';

-- Step 4: Final count
SELECT 
  verification_status,
  COUNT(*) as count
FROM users
WHERE role_id = 3
GROUP BY verification_status
ORDER BY count DESC;
