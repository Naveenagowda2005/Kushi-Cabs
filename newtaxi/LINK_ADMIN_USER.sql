-- ============================================================
-- LINK EXISTING AUTH USER TO ADMIN PROFILE
-- Run this in your Supabase SQL Editor
-- ============================================================

-- First, let's see all auth users to find the correct admin user
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE au.email = 'admin@newtaxi.com';

-- Now create the user profile using the correct UUID
-- Replace 'ACTUAL_UUID_HERE' with the UUID from the query above
/*
INSERT INTO users (id, phone, full_name, role_id, is_active) 
VALUES (
  'ACTUAL_UUID_HERE',  -- Replace with the actual UUID from admin@newtaxi.com
  '+1234567890',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'admin'),
  true
) ON CONFLICT (id) DO UPDATE SET
  role_id = (SELECT id FROM roles WHERE name = 'admin'),
  full_name = 'Super Admin',
  is_active = true;
*/

-- Alternative: Create user profile for ANY admin@newtaxi.com user automatically
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
  AND r.name = 'admin'
ON CONFLICT (id) DO UPDATE SET
  role_id = (SELECT id FROM roles WHERE name = 'admin'),
  full_name = 'Super Admin',
  is_active = true;

-- Verify the user was created
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