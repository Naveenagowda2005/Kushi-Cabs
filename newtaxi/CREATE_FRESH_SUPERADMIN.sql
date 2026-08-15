-- ============================================================
-- CREATE FRESH SUPER ADMIN USER - SAFEST APPROACH
-- This preserves all existing data and creates a new Super Admin
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Check current auth user
SELECT 'Auth user for admin@newtaxi.com:' as info, id, email, created_at 
FROM auth.users 
WHERE email = 'admin@newtaxi.com';

-- Step 2: Check if we already have a super admin user with the correct ID
SELECT 'Existing users with correct auth ID:' as info, u.id, u.full_name, u.email, r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.id = 'b0af6e54-99b1-4065-88d5-82d481320b26';

-- Step 3: If no user exists with the correct ID, create one
-- First, let's check the roles table structure and existing roles
SELECT 'All roles:' as info, id, name FROM roles ORDER BY id;

-- Insert the super admin role if it doesn't exist (using only the columns that exist)
INSERT INTO roles (id, name)
VALUES (5, 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create the Super Admin user with the correct auth ID
INSERT INTO users (
  id,
  full_name,
  email,
  phone,
  role_id,
  is_active
) VALUES (
  'b0af6e54-99b1-4065-88d5-82d481320b26',  -- This matches the auth.users ID
  'Super Admin',
  'admin@newtaxi.com',
  '+1234567890',
  5, -- super_admin role_id
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active;

-- Step 5: Verify the Super Admin user was created correctly
SELECT 
  'New Super Admin user:' as info,
  u.id,
  u.full_name,
  u.email,
  u.phone,
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.id = 'b0af6e54-99b1-4065-88d5-82d481320b26';

-- Step 6: Check that auth and users tables are now aligned
SELECT 
  'Auth and Users alignment check:' as info,
  au.id as auth_id,
  au.email as auth_email,
  u.id as users_id,
  u.email as users_email,
  r.name as role_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE au.email = 'admin@newtaxi.com';

-- Step 7: Optional - Clean up the old orphaned user record (if you want to)
-- Uncomment the following lines if you want to remove the old record
-- (This is safe now since we have a new working Super Admin)

/*
-- Show what will be deleted
SELECT 'Old user record to be cleaned up:' as info, id, full_name, email, phone
FROM users 
WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Delete the old orphaned user record
DELETE FROM users WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';
*/

-- Final success message
SELECT 'SUCCESS: Super Admin setup complete!' as status, 
       'Login with admin@newtaxi.com / admin123' as credentials;