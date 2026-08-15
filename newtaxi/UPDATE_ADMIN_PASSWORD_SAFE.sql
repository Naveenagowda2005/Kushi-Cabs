-- Safely update admin user password without deleting
-- This script updates the admin auth user password to otp-verified-user

-- Step 1: Find the admin user
SELECT id, email FROM auth.users WHERE email = 'admin@newtaxi.com';

-- Step 2: Update the password using pgcrypto
-- The password needs to be hashed with bcrypt
UPDATE auth.users 
SET encrypted_password = crypt('otp-verified-user', gen_salt('bf'))
WHERE email = 'admin@newtaxi.com';

-- Step 3: Verify the update
SELECT id, email FROM auth.users WHERE email = 'admin@newtaxi.com';

-- Step 4: Also update the users table to use phone-based email
UPDATE users 
SET email = '9686314982@kushicabs.phone'
WHERE id = 'b0af6e54-99b1-4065-88d5-82d481320b26';

-- Step 5: Verify
SELECT 
  u.id,
  u.email,
  u.phone,
  u.full_name,
  r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.id = 'b0af6e54-99b1-4065-88d5-82d481320b26';
