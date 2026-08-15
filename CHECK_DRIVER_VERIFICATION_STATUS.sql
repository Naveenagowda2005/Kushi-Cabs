-- Check all driver verification statuses
SELECT 
  u.id,
  u.full_name,
  u.phone,
  u.verification_status,
  u.role_id,
  COUNT(*) as count
FROM users u
WHERE u.role_id = 3
GROUP BY u.verification_status, u.id, u.full_name, u.phone, u.role_id
ORDER BY u.verification_status, u.full_name;

-- Show all verification statuses in the table
SELECT DISTINCT verification_status 
FROM users 
WHERE role_id = 3
ORDER BY verification_status;

-- Count by status
SELECT 
  verification_status,
  COUNT(*) as total
FROM users
WHERE role_id = 3
GROUP BY verification_status
ORDER BY verification_status;
