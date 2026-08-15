-- Fix: Set dummy driver verification status to 'approved'
-- Dummy driver phone: 8050017071

UPDATE users
SET verification_status = 'approved'
WHERE phone = '8050017071';

-- Verify the change
SELECT id, full_name, phone, verification_status, is_active 
FROM users 
WHERE phone = '8050017071';
