-- Test script to verify admin trip visibility for drivers

-- 1. Check the current RLS policy
SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies 
WHERE tablename = 'trips' AND policyname LIKE '%Drivers%'
ORDER BY tablename, policyname;

-- 2. Check if a driver can see an admin trip they're assigned to
-- First, get a test driver and admin trip
WITH driver_info AS (
  SELECT u.id as user_id, d.id as driver_id, u.full_name
  FROM users u
  JOIN drivers d ON d.user_id = u.id
  WHERE u.full_name LIKE '%DUMMY%' LIMIT 1
),
admin_trip AS (
  SELECT id, is_admin_trip, admin_assigned_drivers, accepted_by, status
  FROM trips
  WHERE is_admin_trip = TRUE
  LIMIT 1
)
SELECT 
  d.full_name as driver_name,
  d.user_id,
  t.id as trip_id,
  t.is_admin_trip,
  t.admin_assigned_drivers,
  t.accepted_by,
  t.status,
  d.user_id = ANY(t.admin_assigned_drivers) as driver_in_array,
  d.user_id = t.accepted_by as driver_is_acceptor
FROM driver_info d, admin_trip t;

-- 3. Manually test the RLS condition for a specific driver
-- Replace 'DUMMY_DRIVER_USER_ID' with actual user ID
-- The policy should allow the driver to see the trip if:
-- - They're a driver (exists in drivers table)
-- - AND one of these conditions:
--   1. Trip is pending vendor trip (not admin) after 5-min window
--   2. Trip has their driver_id
--   3. Trip.accepted_by = their user_id
--   4. Trip is admin AND their user_id is in admin_assigned_drivers array AND status is pending
