-- Check recently assigned trips
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  pickup_location,
  dropoff_location,
  created_at
FROM trips
WHERE accepted_by IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should show recently assigned trips with accepted_by populated
-- If empty: No trips have been assigned yet
