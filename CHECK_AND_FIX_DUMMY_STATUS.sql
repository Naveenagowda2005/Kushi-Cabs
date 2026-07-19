-- Check current dummy driver status
SELECT id, full_name, phone, verification_status, is_active 
FROM users 
WHERE phone = '8050017071';

-- If verification_status is not 'approved', update it
UPDATE users
SET verification_status = 'approved'
WHERE phone = '8050017071' AND verification_status != 'approved';

-- Verify the update
SELECT id, full_name, phone, verification_status, is_active 
FROM users 
WHERE phone = '8050017071';
