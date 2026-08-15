-- ============================================================================
-- CREATE SUPER ADMIN - AUTO-LINK FROM AUTH USERS
-- ============================================================================
-- This script finds an existing auth user and creates the profile
-- ============================================================================

-- Step 1: Check existing auth users
SELECT 'Step 1: Checking auth users' as step;
SELECT id, email, phone FROM auth.users LIMIT 10;

-- Step 2: Create admin profile from first auth user
-- This will link any existing auth user to the super_admin role
INSERT INTO users (
  id,
  email,
  phone,
  full_name,
  role_id,
  is_active
)
SELECT
  au.id,
  COALESCE(au.email, '9686314982@kushicabs.phone'),
  COALESCE(au.phone, '9686314982'),
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = au.id
)
LIMIT 1
RETURNING 
  id as "User ID",
  email,
  phone,
  full_name,
  'ADMIN CREATED' as status;

-- Step 3: Verify
SELECT 'Step 3: Super Admin Created' as step;
SELECT 
  u.id,
  u.email,
  u.phone,
  u.full_name,
  r.name as role,
  u.is_active
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE r.name = 'super_admin'
LIMIT 1;
