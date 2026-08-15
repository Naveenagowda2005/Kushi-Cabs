-- ============================================================
-- FIX SUPER ADMIN USER ID WITH ALL FOREIGN KEY UPDATES
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Update all tables that reference the old user ID
-- Update vendors table
UPDATE vendors 
SET user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Update drivers table
UPDATE drivers 
SET user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Update wallets table
UPDATE wallets 
SET user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Update trips table (created_by, accepted_by)
UPDATE trips 
SET created_by = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE created_by = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

UPDATE trips 
SET accepted_by = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE accepted_by = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Update documents table
UPDATE documents 
SET user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Step 2: Now update the main users table
UPDATE users 
SET id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46'
  AND role_id = 5;

-- Step 3: Verify all updates
SELECT 'USERS' as table_name, COUNT(*) as count FROM users WHERE id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
UNION ALL
SELECT 'VENDORS' as table_name, COUNT(*) as count FROM vendors WHERE user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
UNION ALL
SELECT 'DRIVERS' as table_name, COUNT(*) as count FROM drivers WHERE user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
UNION ALL
SELECT 'WALLETS' as table_name, COUNT(*) as count FROM wallets WHERE user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
UNION ALL
SELECT 'TRIPS_CREATED' as table_name, COUNT(*) as count FROM trips WHERE created_by = 'b0af6e54-99b1-4065-88d5-82d481320b26'
UNION ALL
SELECT 'TRIPS_ACCEPTED' as table_name, COUNT(*) as count FROM trips WHERE accepted_by = 'b0af6e54-99b1-4065-88d5-82d481320b26';

-- Step 4: Final verification - show the super admin user
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

-- ============================================================