-- Check Malavalli to Bangalore trip details
SELECT 
  id,
  pickup_location,
  dropoff_location,
  driver_id,
  is_admin_trip,
  status,
  created_at,
  created_by,
  (SELECT full_name FROM users WHERE id = created_by) as creator_name,
  (SELECT full_name FROM drivers WHERE id = driver_id) as driver_name
FROM trips
WHERE 
  pickup_location ILIKE '%malavalli%' 
  OR dropoff_location ILIKE '%malavalli%'
ORDER BY created_at DESC
LIMIT 10;
