-- Create Super Admin user for OTP-based login
-- This script creates both the auth user and the user profile

-- Step 1: Insert super_admin role if it doesn't exist
INSERT INTO roles (name) VALUES ('super_admin') 
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create the super admin user profile
-- Using a fixed UUID that matches the auth user
INSERT INTO users (id, phone, full_name, role_id, is_active, email)
VALUES (
  'b0af6e54-99b1-4065-88d5-82d481320b26',  -- Fixed UUID for admin
  '9686314982',  -- Admin phone number
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true,
  'admin@newtaxi.com'
)
ON CONFLICT (id) DO UPDATE SET
  phone = '9686314982',
  full_name = 'Super Admin',
  email = 'admin@newtaxi.com',
  role_id = (SELECT id FROM roles WHERE name = 'super_admin'),
  is_active = true;

-- Step 3: Verify the user was created
SELECT 
  u.id,
  u.email,
  u.phone,
  u.full_name,
  r.name as role_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@newtaxi.com';
