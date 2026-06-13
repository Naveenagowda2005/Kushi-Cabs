-- CREATE AND APPROVE VENDOR
-- For user: 2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19

-- Step 1: Get the vendor_id for this user
WITH vendor_info AS (
  SELECT 
    u.id as user_id,
    u.phone,
    v.id as vendor_id
  FROM users u
  LEFT JOIN vendors v ON u.id = v.user_id
  WHERE u.id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19'
)

-- Step 2: Create vendor_verification_status record with 'approved' status
INSERT INTO vendor_verification_status (
  vendor_id,
  user_id,
  overall_status,
  all_documents_submitted,
  submitted_at,
  approved_at,
  created_at,
  updated_at
)
SELECT 
  vendor_id,
  user_id,
  'approved',
  true,
  NOW(),
  NOW(),
  NOW(),
  NOW()
FROM vendor_info
ON CONFLICT (user_id) DO UPDATE SET
  overall_status = 'approved',
  approved_at = NOW(),
  all_documents_submitted = true,
  updated_at = NOW();

-- Step 3: Update users table
UPDATE users
SET verification_status = 'approved'
WHERE id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19'
  AND verification_status != 'approved';

-- Step 4: Verify the fix
SELECT 
  u.id,
  u.phone,
  u.verification_status,
  vvs.overall_status,
  vvs.approved_at
FROM users u
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19';
