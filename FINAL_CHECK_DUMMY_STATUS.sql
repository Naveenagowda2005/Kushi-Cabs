-- Final verification of dummy driver status
SELECT 
  u.id, 
  u.full_name, 
  u.phone, 
  u.verification_status,
  u.role_id,
  CASE WHEN u.phone = '8050017071' THEN 'YES - DUMMY' ELSE 'NO' END as is_dummy
FROM users u
WHERE u.role_id = 3
ORDER BY u.verification_status, u.full_name;

-- Count by status
SELECT 
  verification_status,
  COUNT(*) as count
FROM users
WHERE role_id = 3
GROUP BY verification_status
ORDER BY verification_status;
