-- ============================================================
-- FIX: Change roles table to use numeric IDs
-- ============================================================
-- Run this in NEW Supabase Account
-- Change role_id from UUID to numeric (2, 3, 5) to match OLD account
-- ============================================================

-- Step 1: Check current roles
SELECT id, name FROM roles;

-- Step 2: Backup - see current state
SELECT 'Before migration:' as status;
SELECT COUNT(*) as total_roles FROM roles;
SELECT id, name FROM roles ORDER BY name;

-- Step 3: Create new roles table with numeric IDs
CREATE TABLE IF NOT EXISTS roles_new (
  id INT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert roles with numeric IDs (matching OLD account)
INSERT INTO roles_new (id, name) VALUES
(2, 'vendor'),
(3, 'driver'),
(5, 'super_admin')
ON CONFLICT DO NOTHING;

-- Step 5: Get old role mappings (for reference)
-- This helps map old UUID role_ids to new numeric ones
-- Run this to see the mapping
SELECT 
  COALESCE(r.id::TEXT, 'NULL') as old_uuid_id,
  r.name as role_name,
  CASE 
    WHEN r.name = 'vendor' THEN 2
    WHEN r.name = 'driver' THEN 3
    WHEN r.name = 'super_admin' THEN 5
    ELSE 0
  END as new_numeric_id
FROM roles r
ORDER BY r.name;

-- Step 6: Drop old roles table (CAREFULLY - check dependencies first)
-- First check if roles is used in users table
SELECT COUNT(*) as users_with_roles FROM users WHERE role_id IS NOT NULL;

-- Step 7: Rename tables
ALTER TABLE roles RENAME TO roles_old;
ALTER TABLE roles_new RENAME TO roles;

-- Step 8: Update users table - convert role_id from UUID to numeric
-- This updates all user role references to use numeric IDs
UPDATE users u
SET role_id = CASE 
  WHEN u.role_id::TEXT = (SELECT DISTINCT old_uuid FROM (
    SELECT r.id::TEXT as old_uuid FROM roles_old r WHERE r.name = 'vendor'
  ) t) THEN '2'
  WHEN u.role_id::TEXT = (SELECT DISTINCT old_uuid FROM (
    SELECT r.id::TEXT as old_uuid FROM roles_old r WHERE r.name = 'driver'
  ) t) THEN '3'
  WHEN u.role_id::TEXT = (SELECT DISTINCT old_uuid FROM (
    SELECT r.id::TEXT as old_uuid FROM roles_old r WHERE r.name = 'super_admin'
  ) t) THEN '5'
  ELSE u.role_id
END
WHERE role_id IS NOT NULL;

-- Step 9: Verify migration
SELECT 'After migration:' as status;
SELECT id, name FROM roles;
SELECT 'Users by role:' as check_type;
SELECT r.id, r.name, COUNT(u.id) as user_count
FROM roles r
LEFT JOIN users u ON u.role_id = r.id::TEXT
GROUP BY r.id, r.name;

-- Step 10: Clean up old table (optional - after verification)
-- DROP TABLE roles_old;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check all roles exist
SELECT 'Roles in NEW account:' as status;
SELECT * FROM roles ORDER BY id;

-- Check role assignments
SELECT 'Role distribution in users:' as status;
SELECT role_id, COUNT(*) as count FROM users GROUP BY role_id;

-- Check for any NULL roles (might need fixing)
SELECT 'Users with NULL role_id:' as status;
SELECT COUNT(*) as null_role_count FROM users WHERE role_id IS NULL;

-- Show sample users with their roles
SELECT 'Sample users with roles:' as status;
SELECT u.id, u.phone, u.name, u.role_id, r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id::TEXT
LIMIT 10;
