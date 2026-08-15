-- ============================================================================
-- SUPER ADMIN PROFILE - AFTER Creating Auth User
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Create auth user in Supabase UI (see SUPER_ADMIN_AUTH_FIX.md)
-- 2. Copy the User ID shown
-- 3. Replace 'YOUR_USER_ID_HERE' below with that UUID
-- 4. Run this SQL
--
-- Example User ID: 550e8400-e29b-41d4-a716-446655440000
-- ============================================================================

INSERT INTO users (
  id,
  email,
  phone,
  full_name,
  role_id,
  is_active
)
VALUES (
  'YOUR_USER_ID_HERE',  -- ← Replace this with the UUID from Supabase Auth UI
  '9686314982@kushicabs.phone',
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
)
RETURNING 
  id as "User ID",
  email,
  phone,
  full_name,
  'SUCCESS' as status;
