-- Check if there are any triggers on users table
SELECT trigger_name, trigger_schema
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table = 'users';

-- Check RLS policies on users table
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Check the actual current status in database
SELECT id, full_name, phone, verification_status, role_id, is_active
FROM users
WHERE phone = '8050017071';

-- Try a direct update with explicit setting
UPDATE users
SET verification_status = 'approved'::text
WHERE phone = '8050017071'
RETURNING id, full_name, phone, verification_status;
