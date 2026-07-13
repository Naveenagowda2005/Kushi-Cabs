-- ============================================================
-- Fix: Change super_admin role ID from 4 to 5
-- ============================================================
-- Run this in NEW Supabase Account
-- ============================================================

-- Step 1: Check current state
SELECT 'BEFORE:' as status;
SELECT id, name FROM roles ORDER BY id;

-- Step 2: Update super_admin role ID from 4 to 5
UPDATE roles SET id = 5 WHERE name = 'super_admin';

-- Step 3: Update all users with role_id = 4 to role_id = 5
UPDATE users SET role_id = '5' WHERE role_id = '4';

-- Step 4: Verify changes
SELECT 'AFTER:' as status;
SELECT id, name FROM roles ORDER BY id;

SELECT 'Users by role:' as status;
SELECT role_id, COUNT(*) as user_count FROM users WHERE role_id IS NOT NULL GROUP BY role_id;

SELECT 'Final roles table:' as status;
SELECT * FROM roles ORDER BY id;

-- Done!
SELECT 'COMPLETE - super_admin is now ID 5' as result;
