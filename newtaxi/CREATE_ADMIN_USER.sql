-- ============================================================
-- CREATE ADMIN USER FOR SUPER ADMIN APP
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Create the admin user profile
-- Using a fixed UUID that we'll match with the auth user
INSERT INTO users (id, phone, full_name, role_id, is_active) 
VALUES (
  'ef1477e2-56c8-49a3-b32e-6a6bfe2db4f5',
  '+1234567890',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'admin'),
  true
) ON CONFLICT (id) DO UPDATE SET
  role_id = (SELECT id FROM roles WHERE name = 'admin'),
  full_name = 'Super Admin',
  is_active = true;

-- Step 2: Verify the user was created
SELECT 
  u.id,
  u.full_name,
  u.phone,
  r.name as role_name,
  u.is_active,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.id = 'ef1477e2-56c8-49a3-b32e-6a6bfe2db4f5';

-- ============================================================
-- NEXT STEPS:
-- ============================================================
-- 1. After running this SQL, go to Supabase Dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add user" and create:
--    - Email: admin@newtaxi.com
--    - Password: admin123
--    - User ID: ef1477e2-56c8-49a3-b32e-6a6bfe2db4f5
--    - Confirm email: Yes
--
-- 4. The Super Admin app will now work with:
--    Email: admin@newtaxi.com
--    Password: admin123
-- ============================================================