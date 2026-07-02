-- Check driver with phone 9686314982
SELECT 
  u.id as user_id,
  u.phone,
  u.full_name,
  u.is_active,
  d.id as driver_id,
  d.vehicle_number,
  d.is_online
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.phone = '9686314982';

-- ============================================================
-- Check if this driver has any assigned trips
-- ============================================================

-- Get the user_id from above query, then run:
-- SELECT id, status, driver_id, accepted_by, pickup_location
-- FROM trips
-- WHERE accepted_by = '[USER-ID-FROM-ABOVE]'
-- LIMIT 5;
