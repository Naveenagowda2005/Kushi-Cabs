-- ============================================================
-- SUPER ADMIN SETUP SCRIPT
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Add super_admin role if it doesn't exist
INSERT INTO roles (name) VALUES ('super_admin') 
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create Super Admin user in auth.users table
-- Note: You'll need to run this with proper service role permissions
-- or create the user through Supabase Auth UI first

-- For now, let's create a placeholder user entry that can be linked later
-- First, let's check if we have any existing users we can promote to super admin

-- Step 3: If you have created a user through Supabase Auth UI with email 'admin@newtaxi.com',
-- you can link it by running this (replace 'YOUR_AUTH_USER_ID' with the actual UUID):

/*
INSERT INTO users (id, phone, full_name, role_id, is_active) 
VALUES (
  'YOUR_AUTH_USER_ID',  -- Replace with actual auth user ID
  '+1234567890',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
) ON CONFLICT (id) DO UPDATE SET
  role_id = (SELECT id FROM roles WHERE name = 'super_admin'),
  full_name = 'Super Admin',
  is_active = true;
*/

-- Step 4: Verify the setup
SELECT 
  u.id,
  u.full_name,
  u.phone,
  r.name as role_name,
  u.is_active,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'super_admin';

-- Step 5: Show all roles for reference
SELECT * FROM roles ORDER BY id;

-- ============================================================
-- INSTRUCTIONS:
-- ============================================================
-- 1. First, create a user in Supabase Auth UI:
--    - Go to Authentication > Users in Supabase Dashboard
--    - Click "Add user"
--    - Email: admin@newtaxi.com
--    - Password: admin123
--    - Confirm email: Yes
--
-- 2. Copy the user ID from the created user
--
-- 3. Replace 'YOUR_AUTH_USER_ID' in the INSERT statement above
--    with the actual UUID and run it
--
-- 4. The Super Admin app should now work with:
--    Email: admin@newtaxi.com
--    Password: admin123
-- ============================================================