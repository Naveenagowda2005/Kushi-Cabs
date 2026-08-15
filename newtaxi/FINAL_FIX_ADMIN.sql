-- Final fix: Use the correct admin user with phone 9686314982

-- Step 1: Verify the correct admin user exists
SELECT id, phone, full_name, role_id FROM users WHERE phone = '9686314982';

-- Step 2: Update the email to match the phone-based format
UPDATE users 
SET email = '9686314982@kushicabs.phone'
WHERE phone = '9686314982';

-- Step 3: Verify the update
SELECT id, email, phone, full_name, role_id FROM users WHERE phone = '9686314982';

-- Step 4: Now you need to update the auth user in Supabase Dashboard
-- Go to: Supabase Dashboard → Authentication → Users
-- Find the user with email starting with "9686314982"
-- If it doesn't exist, create a NEW auth user:
--   Email: 9686314982@kushicabs.phone
--   Password: otp-verified-user
--   Click "Create user"

-- Step 5: Verify everything is correct
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
