-- Verify dummy vendor setup after /admin/create-dummy-vendor is called
-- Replace 9876543210 with actual dummy vendor phone number

SELECT 
  u.id as user_id,
  u.phone,
  u.full_name,
  u.verification_status,
  v.id as vendor_id,
  v.company_name,
  vvs.overall_status as verification_status_from_vvs
FROM users u
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.phone = '9876543210'
ORDER BY u.created_at DESC;

-- Expected output:
-- user.verification_status should be 'approved'
-- vendor_verification_status.overall_status should be 'approved' (if record exists)
