-- ============================================================
-- UNSTICK PHONE NUMBER: 1123456789
-- ============================================================
-- This script removes any stuck/partial registration records for phone number 1123456789

-- 1. Check if user exists in auth.users (by email derived from phone)
SELECT id, email, created_at FROM auth.users 
WHERE email LIKE '1123456789%' OR email = '1123456789@kushicabs.phone';

-- 2. Check if user exists in users table
SELECT id, phone, email, is_active, created_at FROM users WHERE phone = '1123456789';

-- 3. Check if there's a vendor record
SELECT id, user_id, company_name, created_at FROM vendors WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

-- 4. Check if there's a driver record
SELECT id, user_id, license_number, created_at FROM drivers WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

-- 5. Check if there's a wallet
SELECT id, user_id, balance, updated_at FROM wallets WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

-- 6. Check auth metadata or phone_number field if it exists
-- Note: This depends on your auth.users schema
SELECT 
  id, 
  email, 
  phone, 
  created_at,
  raw_user_meta_data 
FROM auth.users 
WHERE phone = '1123456789' OR email = '1123456789@kushicabs.phone';
