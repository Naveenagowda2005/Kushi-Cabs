-- Fix admin authentication
-- This script deletes the old admin auth user and creates a new one with the correct password

-- Step 1: Get the admin user ID
SELECT id, email FROM auth.users WHERE email = 'admin@newtaxi.com';

-- Step 2: Delete the old admin auth user (this will cascade delete from users table too)
DELETE FROM auth.users WHERE email = 'admin@newtaxi.com';

-- Step 3: Verify it's deleted
SELECT id, email FROM auth.users WHERE email = 'admin@newtaxi.com';

-- Step 4: Now you need to create a NEW admin user in Supabase Dashboard:
-- Go to: Supabase Dashboard → Authentication → Users
-- Click "Add user"
-- Email: 9686314982@kushicabs.phone
-- Password: otp-verified-user
-- Click "Create user"

-- Step 5: After creating the new auth user, run this to create the user profile:
INSERT INTO users (phone, full_name, role_id, is_active, email)
VALUES (
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true,
  '9686314982@kushicabs.phone'
)
ON CONFLICT (phone) DO UPDATE SET
  full_name = 'Super Admin',
  role_id = (SELECT id FROM roles WHERE name = 'super_admin'),
  is_active = true,
  email = '9686314982@kushicabs.phone';

-- Step 6: Verify the admin user was created
SELECT 
  u.id,
  u.email,
  u.phone,
  u.full_name,
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.phone = '9686314982';
