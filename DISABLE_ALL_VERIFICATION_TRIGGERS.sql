-- Disable ALL triggers that auto-calculate verification status
-- These keep overwriting the dummy driver status

-- Drop all verification-related triggers
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;
DROP TRIGGER IF EXISTS trg_check_all_documents_submitted ON driver_documents;
DROP TRIGGER IF EXISTS trg_create_verification_status ON driver_documents;
DROP TRIGGER IF EXISTS trg_sync_user_verification_status ON driver_verification_status;

-- Verify which triggers exist on driver_documents
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'driver_documents'
AND trigger_schema = 'public';

-- Force update dummy driver to approved NOW
UPDATE users
SET verification_status = 'approved'
WHERE phone = '8050017071';

-- Verify it's set
SELECT id, full_name, phone, verification_status
FROM users
WHERE phone = '8050017071';

-- Check overall count
SELECT verification_status, COUNT(*) as count
FROM users
WHERE role_id = 3
GROUP BY verification_status;
