-- ============================================================
-- LINK SUPER ADMIN PROFILE TO AUTH USER
-- Run this in your Supabase SQL Editor AFTER creating auth user
-- ============================================================

-- Step 1: First create an auth user in Supabase Dashboard with:
-- Email: admin@newtaxi.com
-- Password: admin123
-- Then get the auth user ID and replace 'YOUR_AUTH_USER_ID' below

-- Step 2: Update the existing super admin profile to use the new auth user ID
UPDATE users 
SET id = 'YOUR_AUTH_USER_ID'  -- Replace with actual auth user ID
WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46' 
  AND role_id = 5;

-- Step 3: Verify the update
SELECT 
  u.id,
  u.full_name,
  u.phone,
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'super_admin';

-- ============================================================
-- INSTRUCTIONS:
-- 1. Create auth user in Supabase Dashboard first
-- 2. Copy the auth user ID 
-- 3. Replace 'YOUR_AUTH_USER_ID' above with the real ID
-- 4. Run this SQL
-- 5. Login with admin@newtaxi.com / admin123
-- ============================================================