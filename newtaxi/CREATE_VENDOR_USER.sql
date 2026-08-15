-- ============================================================
-- CREATE VENDOR USER FOR EXISTING AUTH USER
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Check if the auth user exists
SELECT 'Auth user check:' as info, id, email, created_at 
FROM auth.users 
WHERE id = 'bd2ab895-98c7-4d8e-a695-ba0c2540edf5';

-- Check if user already exists in users table
SELECT 'Users table check:' as info, id, full_name, email, role_id
FROM users 
WHERE id = 'bd2ab895-98c7-4d8e-a695-ba0c2540edf5';

-- Get the vendor role ID
SELECT 'Vendor role:' as info, id, name FROM roles WHERE name = 'vendor';

-- Create the vendor user in users table
INSERT INTO users (
  id,
  full_name,
  email,
  phone,
  role_id,
  is_active
) VALUES (
  'bd2ab895-98c7-4d8e-a695-ba0c2540edf5',
  'Test Vendor',
  'vendor@test.com', -- Update with actual email if known
  '+1234567890',
  2, -- vendor role_id (assuming 2 is vendor)
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active;

-- Create vendor profile in vendors table
INSERT INTO vendors (
  user_id,
  company_name,
  license_number,
  commission_pct,
  is_available
) VALUES (
  'bd2ab895-98c7-4d8e-a695-ba0c2540edf5',
  'Test Vendor Company',
  'VL123456',
  10.0, -- 10% commission
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  commission_pct = EXCLUDED.commission_pct,
  is_available = EXCLUDED.is_available;

-- Create wallet for the vendor
INSERT INTO wallets (
  user_id,
  balance
) VALUES (
  'bd2ab895-98c7-4d8e-a695-ba0c2540edf5',
  0.00
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the vendor user was created
SELECT 
  'Vendor user created:' as info,
  u.id,
  u.full_name,
  u.email,
  r.name as role_name,
  v.company_name,
  v.commission_pct,
  w.balance
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.id = 'bd2ab895-98c7-4d8e-a695-ba0c2540edf5';

-- ============================================================