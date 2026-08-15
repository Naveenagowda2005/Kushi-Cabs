-- Test: Can a driver see their assigned trips?
-- Pick a driver from the accepted_by column and test

-- First, get a driver's user_id from an assigned trip
SELECT DISTINCT 
  accepted_by as driver_user_id,
  COUNT(*) as trip_count
FROM trips
WHERE accepted_by IS NOT NULL
GROUP BY accepted_by
LIMIT 5;

-- ============================================================
-- Then test: Can this driver see their trips through RLS?
-- ============================================================

-- Replace 'DRIVER-USER-ID' with one from above results
-- For example: '11a3cf59-6d65-4e4d-b5ac-d3593d887c70'

SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  pickup_location,
  dropoff_location
FROM trips
WHERE accepted_by = '11a3cf59-6d65-4e4d-b5ac-d3593d887c70'
  AND status IN ('accepted', 'in_progress');

-- Expected: Should return trips for this driver
-- If empty: Either no trips for this driver, or RLS is blocking
