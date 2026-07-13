-- ============================================================================
-- ADD SUPER ADMIN USER - For Fresh Supabase Account
-- ============================================================================
-- Use this script to create a super admin user in your NEW Supabase account
-- 
-- STEPS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy this entire script
-- 4. Paste into SQL Editor
-- 5. Click "Run" button
-- 6. Note down the USER ID shown in the result
-- ============================================================================

-- Step 1: Get or create the super_admin role
-- (It should already exist from migrations)
SELECT 'Step 1: Checking super_admin role' as step;
SELECT id, name FROM roles WHERE name = 'super_admin';

-- Step 2: Generate a new UUID for the admin user
-- We'll use a fixed UUID for consistency (you can generate a new one if needed)
WITH admin_data AS (
  SELECT 
    gen_random_uuid() as new_user_id,
    '9686314982' as admin_phone,
    '9686314982@kushicabs.phone' as admin_email,
    'Super Admin' as admin_name
)
INSERT INTO users (
  id,
  email,
  phone,
  full_name,
  role_id,
  is_active,
  created_at,
  updated_at
)
SELECT
  ad.new_user_id,
  ad.admin_email,
  ad.admin_phone,
  ad.admin_name,
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true,
  now(),
  now()
FROM admin_data
RETURNING 
  id as "User ID",
  email,
  phone,
  full_name,
  'SAVED - Use this User ID' as note;

-- Step 3: Verify the super admin was created
SELECT 
  'Step 3: Super Admin Created Successfully' as result,
  u.id,
  u.email,
  u.phone,
  u.full_name,
  r.name as role
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE r.name = 'super_admin'
LIMIT 1;

-- Step 4: Check all roles in system (for reference)
SELECT 'All Roles in System:' as section;
SELECT id, name FROM roles ORDER BY id;
