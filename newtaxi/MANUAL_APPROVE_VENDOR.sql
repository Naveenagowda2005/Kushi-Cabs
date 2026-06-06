-- ============================================================
-- MANUAL VENDOR APPROVAL - FOR TESTING ONLY
-- ============================================================
-- Replace 'YOUR_PHONE_NUMBER' with the actual vendor phone number

-- Find the vendor by phone
SELECT id, full_name, phone, role 
FROM users 
WHERE phone = '9686314982' 
AND role = 'vendor';

-- Get their verification status
SELECT * 
FROM vendor_verification_status 
WHERE user_id = (
  SELECT id FROM users WHERE phone = '9686314982' AND role = 'vendor'
);

-- Get their documents
SELECT * 
FROM vendor_documents 
WHERE user_id = (
  SELECT id FROM users WHERE phone = '9686314982' AND role = 'vendor'
);

-- ============================================================
-- APPROVE THE VENDOR (Run this after checking above)
-- ============================================================

UPDATE vendor_verification_status
SET 
  overall_status = 'approved',
  approved_at = NOW(),
  verified_at = NOW()
WHERE user_id = (
  SELECT id FROM users WHERE phone = '9686314982' AND role = 'vendor'
);

-- Update users table as well
UPDATE users
SET verification_status = 'approved'
WHERE phone = '9686314982' AND role = 'vendor';

-- Verify the update
SELECT 
  u.full_name,
  u.phone,
  u.verification_status,
  vvs.overall_status,
  vvs.approved_at
FROM users u
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.phone = '9686314982' AND u.role = 'vendor';
