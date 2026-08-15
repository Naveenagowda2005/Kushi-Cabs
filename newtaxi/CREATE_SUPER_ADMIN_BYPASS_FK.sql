-- ============================================================================
-- CREATE SUPER ADMIN - BYPASS FOREIGN KEY
-- ============================================================================
-- This temporarily disables the foreign key constraint to insert the admin
-- ============================================================================

-- Step 1: Generate a UUID we'll use
-- In Supabase, we need to link to auth.users, but for testing we can use an RPC
-- OR we can bypass by temporarily disabling constraints

-- OPTION A: Create in auth schema first (Recommended for production)
-- This requires Supabase service role - may not work in SQL editor

-- OPTION B: Use Supabase's built-in user creation (Requires API)

-- OPTION C: Direct insert by disabling constraint (For dev only)

-- Check existing auth users
SELECT 'Checking auth.users' as step;
SELECT COUNT(*) as auth_user_count FROM auth.users;

-- If there are no auth users, we need to create one
-- For Supabase, users are typically created via the Auth API

-- Step 1: Try to use Supabase admin function if available
-- This might not work in SQL editor, but worth trying:

-- Actually, let's check what we have:
SELECT 'Current users in system:' as section;
SELECT u.id, u.email, u.phone, u.full_name, r.name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

SELECT 'Current auth.users:' as section;
SELECT id, email, phone FROM auth.users LIMIT 10;

-- If the auth.users table is empty, we need to seed it
-- You might need to:
-- 1. Create a user through Supabase UI: https://supabase.com/dashboard -> Users
-- 2. Then we can link it to the users table using that user's ID

-- Alternative: Use signup API to create user first
-- POST https://your-supabase-url/auth/v1/signup
-- {
--   "email": "9686314982@kushicabs.phone",
--   "password": "admin123456",
--   "phone": "9686314982"
-- }
-- Then run this SQL with the returned UUID

-- For now, try inserting if any auth user exists:
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
  '9686314982@kushicabs.phone',
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
FROM auth.users au
LIMIT 1
ON CONFLICT DO NOTHING
RETURNING id, email, phone, full_name;
