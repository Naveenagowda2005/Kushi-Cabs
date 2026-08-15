-- ============================================================
-- CREATE SUPER ADMIN FROM ANY EXISTING AUTH USER
-- Run this in your Supabase SQL Editor
-- ============================================================

-- First, let's see ALL auth users to pick one
SELECT 
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at
LIMIT 10;

-- ============================================================
-- OPTION 1: Use the first user from your auth.users table
-- ============================================================

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create super admin profile using the FIRST auth user
INSERT INTO users (id, phone, full_name, role_id, is_active)
SELECT 
  au.id,
  '+1234567890',
  'Super Admin',
  5,
  true
FROM auth.users au
ORDER BY au.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  role_id = 5,
  full_name = 'Super Admin',
  is_active = true;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Show the result
SELECT 
  u.id,
  u.full_name,
  u.phone,
  r.name as role_name,
  u.is_active,
  au.email
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN auth.users au ON u.id = au.id
WHERE u.role_id = 5;

-- ============================================================