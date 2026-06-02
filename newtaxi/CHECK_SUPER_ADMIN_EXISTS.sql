-- Check what super_admin users exist

-- Step 1: Check all super_admin users
SELECT 
  u.id,
  u.phone,
  u.email,
  u.full_name,
  r.name as role,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'super_admin';

-- Step 2: Check if phone 9686314982 exists
SELECT 
  id,
  phone,
  email,
  full_name,
  role_id
FROM users
WHERE phone = '9686314982';

-- Step 3: Get the role_id for super_admin role
SELECT id, name FROM roles WHERE name = 'super_admin';
