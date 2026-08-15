-- Update admin user password to otp-verified-user
-- Run this in Supabase SQL Editor

-- First, find the admin user
SELECT id, email FROM auth.users WHERE email = 'admin@newtaxi.com';

-- Update the password using the admin API
-- Note: You need to use Supabase Admin API or manually reset the password
-- For now, we'll use the update_user function if available

-- Alternative: Delete and recreate the admin user with the new password
-- But first, let's try to update it

-- Get the admin user ID
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@newtaxi.com'
)
UPDATE auth.users 
SET encrypted_password = crypt('otp-verified-user', gen_salt('bf'))
WHERE id IN (SELECT id FROM admin_user);

-- Verify the update
SELECT id, email FROM auth.users WHERE email = 'admin@newtaxi.com';
