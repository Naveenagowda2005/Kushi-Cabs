-- ============================================================
-- LINK EXISTING AUTH USER TO SUPER ADMIN PROFILE
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create user profile using super_admin role (ID: 5)
INSERT INTO users (id, phone, full_name, role_id, is_active)
SELECT 
  au.id,
  '+1234567890',
  'Super Admin',
  r.id,
  true
FROM auth.users au
CROSS JOIN roles r
WHERE au.email = 'admin@newtaxi.com' 
  AND r.name = 'super_admin'
ON CONFLICT (id) DO UPDATE SET
  role_id = (SELECT id FROM roles WHERE name = 'super_admin'),
  full_name = 'Super Admin',
  is_active = true;

-- Verify the user was created with super_admin role
SELECT 
  u.id,
  u.full_name,
  u.phone,
  r.name as role_name,
  u.is_active,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@newtaxi.com';

-- ============================================================