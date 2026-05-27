-- ============================================================
-- FIX SUPER ADMIN USER ID - FINAL SOLUTION
-- Run this in your Supabase SQL Editor
-- ============================================================

-- First, let's check what we have
SELECT 'Current auth user ID that exists:' as info, id, email FROM auth.users WHERE email = 'admin@newtaxi.com';
SELECT 'Current users table record:' as info, id, full_name, phone, role_id FROM users WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- APPROACH 1: Update the users table ID to match the auth user ID
-- This is the cleanest solution

-- Step 1: Temporarily disable foreign key constraints (if needed)
-- We'll work around them by updating in the right order

-- Step 2: First, let's see if there are any records referencing the old ID
SELECT 'Vendors referencing old ID:' as info, COUNT(*) as count FROM vendors WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';
SELECT 'Drivers referencing old ID:' as info, COUNT(*) as count FROM drivers WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';
SELECT 'Wallets referencing old ID:' as info, COUNT(*) as count FROM wallets WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Step 3: Handle all foreign key dependencies in the correct order
-- We need to delete in reverse dependency order to avoid constraint violations

-- First, find all vendor IDs that belong to the old user ID
SELECT 'Vendors that will be affected:' as info, id, company_name FROM vendors WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Delete trips that reference these vendors (most dependent table first)
DELETE FROM trips 
WHERE vendor_id IN (
  SELECT id FROM vendors WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46'
);

-- Delete trips created or accepted by the old user ID
DELETE FROM trips WHERE created_by = '09587d0c-49de-4d9d-b84d-d7210dfeac46' OR accepted_by = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Delete documents that reference the old user ID
DELETE FROM documents WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Delete wallets that reference the old user ID
DELETE FROM wallets WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Delete drivers that reference the old user ID
DELETE FROM drivers WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Finally, delete vendors that reference the old user ID
DELETE FROM vendors WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Step 4: Now update the users table ID to match the auth user ID
UPDATE users 
SET id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Step 5: Verify the update worked
SELECT 'Updated users record:' as info, id, full_name, phone, role_id, email FROM users WHERE id = 'b0af6e54-99b1-4065-88d5-82d481320b26';

-- Step 6: Verify we can join with roles
SELECT 
  'Super admin user with role:' as info,
  u.id,
  u.full_name,
  u.email,
  u.phone,
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.id = 'b0af6e54-99b1-4065-88d5-82d481320b26';

-- ============================================================
-- ALTERNATIVE APPROACH: If the above doesn't work, create a new record
-- ============================================================

-- If the UPDATE fails, we'll insert a new record with the correct ID
-- (Uncomment and run this section if the UPDATE above fails)

/*
-- Delete the old record
DELETE FROM users WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Insert new record with correct ID
INSERT INTO users (
  id,
  full_name,
  email,
  phone,
  role_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'b0af6e54-99b1-4065-88d5-82d481320b26',
  'Super Admin',
  'admin@newtaxi.com',
  '+1234567890',
  5, -- super_admin role_id
  true,
  NOW(),
  NOW()
);
*/

-- Final verification
SELECT 'Final check - Super Admin user:' as info, u.id, u.full_name, u.email, r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@newtaxi.com';