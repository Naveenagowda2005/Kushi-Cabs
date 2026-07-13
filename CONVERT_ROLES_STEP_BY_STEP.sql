-- ============================================================
-- STEP-BY-STEP: Convert roles to numeric IDs
-- ============================================================
-- Run this ONE SECTION AT A TIME in NEW account
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Check current state (RUN THIS FIRST)
-- ═══════════════════════════════════════════════════════════

SELECT 'CURRENT STATE - Roles table:' as check;
SELECT id, name FROM roles ORDER BY name;

SELECT 'CURRENT STATE - Users count by role:' as check;
SELECT role_id, COUNT(*) as user_count FROM users GROUP BY role_id;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Create new roles table with numeric IDs
-- ═══════════════════════════════════════════════════════════

CREATE TABLE roles_new (
  id INT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert numeric role IDs (2, 3, 5) to match OLD account
INSERT INTO roles_new (id, name, created_at, updated_at) VALUES
(2, 'vendor', NOW(), NOW()),
(3, 'driver', NOW(), NOW()),
(5, 'super_admin', NOW(), NOW());

-- Verify new table created correctly
SELECT 'NEW roles table created:' as check;
SELECT id, name FROM roles_new ORDER BY id;

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Create mapping between old UUID and new numeric IDs
-- ═══════════════════════════════════════════════════════════

-- This query shows the mapping - SAVE THIS INFORMATION
SELECT 'MAPPING (OLD UUID → NEW Numeric ID):' as mapping_info;
SELECT 
  r.id as old_uuid_id,
  r.name,
  CASE 
    WHEN r.name = 'vendor' THEN 2
    WHEN r.name = 'driver' THEN 3
    WHEN r.name = 'super_admin' THEN 5
    ELSE 0
  END as new_numeric_id
FROM roles r
ORDER BY r.name;

-- ═══════════════════════════════════════════════════════════
-- STEP 4: Create temp table with role mappings
-- ═══════════════════════════════════════════════════════════

CREATE TABLE role_mapping AS
SELECT 
  r.id::TEXT as old_id,
  CASE 
    WHEN r.name = 'vendor' THEN 2
    WHEN r.name = 'driver' THEN 3
    WHEN r.name = 'super_admin' THEN 5
    ELSE 0
  END as new_id
FROM roles r;

-- Verify mapping table
SELECT 'Role mapping created:' as check;
SELECT * FROM role_mapping;

-- ═══════════════════════════════════════════════════════════
-- STEP 5: Update users table to use numeric role_id
-- ═══════════════════════════════════════════════════════════

-- Update users with the mapping
UPDATE users u
SET role_id = (SELECT new_id::TEXT FROM role_mapping WHERE old_id = u.role_id)
WHERE role_id IS NOT NULL AND role_id IN (SELECT old_id FROM role_mapping);

-- Verify update
SELECT 'Users updated - now checking by role_id:' as check;
SELECT role_id, COUNT(*) as user_count FROM users WHERE role_id IS NOT NULL GROUP BY role_id;

-- ═══════════════════════════════════════════════════════════
-- STEP 6: Rename old roles table and replace with new one
-- ═══════════════════════════════════════════════════════════

-- Rename old roles table as backup
ALTER TABLE roles RENAME TO roles_old_backup;

-- Rename new roles table to roles
ALTER TABLE roles_new RENAME TO roles;

-- Verify new roles table
SELECT 'NEW roles table is now active:' as check;
SELECT id, name FROM roles ORDER BY id;

-- ═══════════════════════════════════════════════════════════
-- STEP 7: Verify all data integrity
-- ═══════════════════════════════════════════════════════════

SELECT 'VERIFICATION - Final State:' as final_check;

SELECT 'Roles in NEW table:' as check;
SELECT id, name FROM roles ORDER BY id;

SELECT 'Users by role (with role names):' as check;
SELECT r.id, r.name, COUNT(u.id) as user_count
FROM roles r
LEFT JOIN users u ON u.role_id = r.id::TEXT
GROUP BY r.id, r.name
ORDER BY r.id;

SELECT 'Sample users with new numeric role_ids:' as check;
SELECT u.id, u.phone, u.name, u.role_id, r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id::TEXT
LIMIT 10;

-- ═══════════════════════════════════════════════════════════
-- STEP 8: Clean up temporary tables (OPTIONAL)
-- ═══════════════════════════════════════════════════════════

-- Only run this after you've verified everything works
-- DROP TABLE IF EXISTS role_mapping;
-- DROP TABLE IF EXISTS roles_old_backup;

-- ═══════════════════════════════════════════════════════════
-- FINAL VERIFICATION - Run this to confirm
-- ═══════════════════════════════════════════════════════════

SELECT 'FINAL VERIFICATION - Everything Ready!' as status;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as users_with_valid_roles FROM users WHERE role_id IN ('2', '3', '5');
SELECT 'Ready to import user data from OLD account!' as next_step;
