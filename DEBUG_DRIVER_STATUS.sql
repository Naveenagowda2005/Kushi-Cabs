-- Check the current driver verification status
SELECT 
  driver_id,
  overall_status,
  approved_at,
  rejected_at,
  is_re_verification,
  updated_at
FROM driver_verification_status
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- Also check the users table for reference
SELECT 
  id,
  verification_status
FROM users
WHERE id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';
