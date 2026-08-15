-- ============================================================================
-- SIMPLE: CREATE SUPER ADMIN - Just Copy & Paste
-- ============================================================================
-- Go to Supabase SQL Editor, paste this, and run it
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
  gen_random_uuid(),
  '9686314982@kushicabs.phone',
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
)
RETURNING id, email, phone, full_name;

-- ============================================================================
-- Result will show the User ID you just created
-- ============================================================================
