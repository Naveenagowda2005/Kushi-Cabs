-- Setup Super Admin in Database Only (No Supabase Auth needed)
-- Super Admin uses phone-based OTP authentication like drivers

-- Step 1: Verify super_admin role exists
SELECT id, name FROM roles WHERE name = 'super_admin';
-- Should return: 5 | super_admin

-- Step 2: Delete any existing super_admin users (cleanup)
DELETE FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');

-- Step 3: Create new super_admin user with phone 9686314982
INSERT INTO users (
  phone,
  email,
  full_name,
  role_id,
  is_active
)
VALUES (
  '9686314982',
  '9686314982@kushicabs.phone',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
);

-- Step 4: Verify super_admin was created
SELECT 
  u.id,
  u.phone,
  u.email,
  u.full_name,
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.phone = '9686314982';
-- Should return one row with role_name = super_admin

-- Step 5: Check that super_admin role_id is 5
SELECT id FROM roles WHERE name = 'super_admin';

-- Done! Super admin is now setup in database only
-- No Supabase Auth user needed for super_admin
-- Login with: phone=9686314982, password=otp-verified-user
