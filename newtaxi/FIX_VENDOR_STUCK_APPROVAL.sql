-- FIX: Vendor stuck on "Waiting for Approval" even after admin approval
-- For phone: 6360306853

-- Step 1: Find the user ID
WITH user_data AS (
  SELECT id as user_id, phone FROM users WHERE phone = '6360306853'
)

-- Step 2: Check current status and fix it
UPDATE vendor_verification_status
SET 
  overall_status = 'approved',
  approved_at = NOW(),
  all_documents_submitted = true
WHERE user_id = (SELECT user_id FROM user_data)
  AND overall_status != 'approved';

-- Step 3: Also update users table for consistency
UPDATE users
SET verification_status = 'approved'
WHERE phone = '6360306853'
  AND verification_status != 'approved';

-- Step 4: Verify the fix
SELECT 
  u.id as user_id,
  u.phone,
  u.verification_status as users_status,
  vvs.overall_status as vendor_vvs_status,
  vvs.approved_at,
  vvs.all_documents_submitted
FROM users u
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.phone = '6360306853';

-- Output should show:
-- users_status = 'approved'
-- vendor_vvs_status = 'approved'
-- approved_at = current timestamp
