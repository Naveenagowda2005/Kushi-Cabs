-- Check if dummy vendor exists and what their verification status is
SELECT 
  u.id as user_id,
  u.phone,
  u.full_name,
  u.verification_status,
  v.id as vendor_id,
  v.company_name,
  vvs.overall_status,
  vvs.user_id as vvs_user_id
FROM users u
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.full_name LIKE 'DUMMY%'
ORDER BY u.created_at DESC
LIMIT 5;
