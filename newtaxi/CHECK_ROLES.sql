-- ============================================================
-- CHECK ROLES AND EXISTING USERS
-- Run this in your Supabase SQL Editor to see current data
-- ============================================================

-- Check all roles
SELECT 'All roles:' as info, id, name FROM roles ORDER BY id;

-- Check existing users and their roles
SELECT 
  'Existing users:' as info,
  u.id,
  u.full_name,
  u.email,
  r.name as role_name,
  u.is_active
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Check existing vendors
SELECT 'Existing vendors:' as info, user_id, company_name, commission_pct FROM vendors LIMIT 5;

-- Check auth users without profiles
SELECT 
  'Auth users without profiles:' as info,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;

-- ============================================================