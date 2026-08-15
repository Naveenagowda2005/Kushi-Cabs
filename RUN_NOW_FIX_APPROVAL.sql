-- Fix: Approve vendor whose all documents are already approved
-- Run this in Supabase SQL Editor

-- Step 1: Approve this specific vendor
UPDATE vendor_verification_status
SET 
  overall_status = 'approved',
  approved_at = NOW(),
  updated_at = NOW()
WHERE vendor_id = (
  SELECT id FROM vendors WHERE user_id = 'aa86be3a-7cb6-4024-a7e7-ace1a1b19778'
);

UPDATE users
SET verification_status = 'approved'
WHERE id = 'aa86be3a-7cb6-4024-a7e7-ace1a1b19778';

-- Step 2: Also fix any other vendors whose all 4 docs are approved but overall_status is still pending
UPDATE vendor_verification_status vvs
SET 
  overall_status = 'approved',
  approved_at = NOW(),
  updated_at = NOW()
WHERE vvs.overall_status = 'pending'
  AND EXISTS (
    SELECT 1 FROM vendor_documents vd
    WHERE vd.vendor_id = vvs.vendor_id
      AND vd.documents->'AADHAR'->>'status' = 'approved'
      AND vd.documents->'PAN_CARD'->>'status' = 'approved'
      AND vd.documents->'BANK_PASSBOOK_FRONT'->>'status' = 'approved'
      AND vd.documents->'VENDOR_SELFIE'->>'status' = 'approved'
  );

-- Step 3: Verify the fix
SELECT 
  u.phone,
  u.verification_status,
  vvs.overall_status,
  vvs.approved_at
FROM users u
JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.id = 'aa86be3a-7cb6-4024-a7e7-ace1a1b19778';
