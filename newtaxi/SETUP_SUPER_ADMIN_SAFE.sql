-- Safe Super Admin Setup - UPDATE instead of DELETE
-- This won't break foreign key constraints

-- Step 1: Find existing super_admin user
SELECT id, phone, email, full_name, role_id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');

-- Step 2: Update existing super_admin user (keep all data, just ensure phone is set correctly)
UPDATE users 
SET 
  phone = '9686314982',
  email = '9686314982@kushicabs.phone',
  full_name = 'Super Admin',
  is_active = true
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');

-- Step 3: Verify the update
SELECT 
  id,
  phone,
  email,
  full_name,
  role_id,
  is_active
FROM users 
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');

-- Step 4: Check the role_id value for super_admin
SELECT id FROM roles WHERE name = 'super_admin';
-- Should be: 5
