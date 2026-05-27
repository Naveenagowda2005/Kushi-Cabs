-- ============================================================
-- FIND THE CORRECT UUID FOR admin@newtaxi.com
-- Run this in your Supabase SQL Editor
-- ============================================================

-- This will show you the exact UUID for admin@newtaxi.com
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'admin@newtaxi.com';

-- ============================================================
-- COPY THE UUID FROM THE RESULT ABOVE AND USE IT BELOW
-- Replace 'PASTE_UUID_HERE' with the actual UUID
-- ============================================================

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create the super admin user (replace PASTE_UUID_HERE with actual UUID)
INSERT INTO users (id, phone, full_name, role_id, is_active) 
VALUES (
  'PASTE_UUID_HERE',  -- Replace this with the UUID from the query above
  '+1234567890',
  'Super Admin',
  5,
  true
) ON CONFLICT (id) DO UPDATE SET
  role_id = 5,
  full_name = 'Super Admin',
  is_active = true;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify the user was created
SELECT 
  u.id,
  u.full_name,
  u.phone,
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.role_id = 5;

-- ============================================================