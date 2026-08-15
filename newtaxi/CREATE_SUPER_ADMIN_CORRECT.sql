-- ============================================================================
-- CREATE SUPER ADMIN - CORRECT METHOD
-- ============================================================================
-- This creates the auth user and profile user together
-- ============================================================================

-- Step 1: Check if roles table exists
SELECT 'Step 1: Verifying roles table' as step;
SELECT id, name FROM roles WHERE name = 'super_admin';

-- Step 2: Check auth.users table structure
SELECT 'Step 2: Creating super admin user through auth' as step;

-- Create the user in auth schema first
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Supabase instance ID (default)
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  '9686314982@kushicabs.phone',
  crypt('admin123456', gen_salt('bf')), -- Encrypted password (you can change this)
  NOW(),
  null,
  '',
  null,
  '',
  null,
  '',
  null,
  null,
  '{"provider":"phone"}',
  '{"full_name":"Super Admin","phone":"9686314982"}',
  false,
  NOW(),
  NOW(),
  '9686314982',
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING 
  id as "Auth User ID Created",
  email,
  phone;

-- Step 3: Now insert the user profile record
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
  au.email,
  au.phone,
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
FROM auth.users au
WHERE au.phone = '9686314982'
  AND au.email = '9686314982@kushicabs.phone'
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = au.id
  )
RETURNING 
  id as "User Profile ID",
  email,
  phone,
  full_name;

-- Step 4: Verify the super admin was created
SELECT 'Step 4: Verifying super admin creation' as step;
SELECT 
  u.id,
  u.email,
  u.phone,
  u.full_name,
  r.name as role,
  u.is_active
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.phone = '9686314982'
LIMIT 1;
