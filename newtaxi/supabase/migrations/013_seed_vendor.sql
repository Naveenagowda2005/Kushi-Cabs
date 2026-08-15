-- Run this to manually create the vendor record for existing users
-- who registered before the vendor insert was working correctly

INSERT INTO vendors (user_id, commission_pct)
SELECT id, 10.00
FROM users
WHERE role_id = (SELECT id FROM roles WHERE name = 'vendor')
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT u.id, u.phone, u.full_name, v.id as vendor_id, v.commission_pct
FROM users u
LEFT JOIN vendors v ON v.user_id = u.id;
