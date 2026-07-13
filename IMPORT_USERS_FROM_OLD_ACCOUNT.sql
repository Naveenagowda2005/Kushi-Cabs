-- ============================================================
-- Import users from OLD account to NEW account
-- ============================================================
-- Run this in NEW Supabase Account SQL Editor
-- ============================================================

-- Insert users with correct column mapping
INSERT INTO users (id, phone, name, role_id, is_active, created_at, updated_at)
VALUES
-- Paste your user data here in this format:
-- ('uuid', 'phone', 'name', role_id, true, now(), now())
-- Example:
-- ('5c9a9ea1-b3e5-4164-907c-4c', '9686502457', 'Waseem', '3', true, NOW(), NOW()),
-- ('d1a8f78a-6f4e-4cb5-ba26-f14', '8660212120', 'SYED DASTHAGIRI', '3', true, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

SELECT 'Users imported successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
