-- ============================================================
-- DELETE SESSION FOR PHONE: 1123456789
-- ============================================================
-- This script deletes the stuck session and clears the auth user

-- Step 1: Find the user ID for this phone
SELECT id, phone, email FROM users WHERE phone = '1123456789';

-- Step 2: Delete all sessions for this user
DELETE FROM active_sessions 
WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

-- Step 3: Delete the user profile (everything cascades)
DELETE FROM users 
WHERE phone = '1123456789';

-- Verify deletion
SELECT COUNT(*) as user_count FROM users WHERE phone = '1123456789';
SELECT COUNT(*) as session_count FROM active_sessions WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

-- ============================================================
-- IMPORTANT: Also delete the auth user
-- ============================================================
-- The auth.users record must be deleted separately from Supabase Dashboard:
-- 
-- 1. Go to: https://supabase.com/dashboard
-- 2. Navigate to: Authentication > Users
-- 3. Search for: 1123456789@kushicabs.phone
-- 4. Click the user row
-- 5. Click the ⋮ (three dots) menu button in top right
-- 6. Select "Delete user"
-- 7. Confirm deletion
--
-- After these SQL deletions + auth user deletion:
-- Phone 1123456789 will be completely reset and available for new registration
-- ============================================================
