-- ============================================================
-- FIX SUPER ADMIN USER ID MISMATCH
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Update the existing super admin profile to use the correct auth user ID
UPDATE users 
SET id = 'b0af6e54-99b1-4065-88d5-82d481320b26'  -- Correct auth user ID
WHERE id = '09587d0c-49de-4d9d-b84d-d7210dfeac46'   -- Old profile ID
  AND role_id = 5;  -- super_admin role

-- Verify the update worked
SELECT 
  u.id,
  u.full_name,
  u.phone,
  r.name as role_name,
  u.is_active,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'super_admin';

-- Also check if wallet needs to be updated
UPDATE wallets 
SET user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26'
WHERE user_id = '09587d0c-49de-4d9d-b84d-d7210dfeac46';

-- Verify wallet update
SELECT * FROM wallets WHERE user_id = 'b0af6e54-99b1-4065-88d5-82d481320b26';

-- ============================================================