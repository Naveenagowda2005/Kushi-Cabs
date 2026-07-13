-- Debug: Check if driver can see reassigned trip

-- Step 1: Get the trip ID and driver ID (example - replace with actual IDs)
SELECT 
  t.id as trip_id,
  t.status,
  t.accepted_by,
  t.driver_id,
  u.id as driver_user_id,
  u.full_name,
  u.phone,
  d.id as driver_id_from_drivers_table
FROM trips t
LEFT JOIN users u ON t.accepted_by = u.id
LEFT JOIN drivers d ON d.user_id = u.id
WHERE t.accepted_by IS NOT NULL
LIMIT 5;

-- Step 2: Check the RLS policy
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'trips' 
  AND policyname = 'Drivers see available and own trips';

-- Step 3: Test with a specific driver user ID
-- Replace 'DRIVER_USER_ID_HERE' with actual driver's user ID
-- SELECT * FROM trips WHERE accepted_by = 'DRIVER_USER_ID_HERE';

-- Step 4: Check indices
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'trips'
  AND (indexname LIKE '%driver%' OR indexname LIKE '%accepted%');

-- Step 5: Verify driver has access to see their assigned trips
-- This is what the driver app queries:
SELECT 
  id,
  status,
  pickup_location,
  dropoff_location,
  created_by,
  accepted_by,
  driver_id
FROM trips
WHERE (
  -- Pending trips after vendor window
  (status = 'pending' AND NOW() > vendor_visible_until)
  -- OR trips assigned via driver_id
  OR driver_id = (SELECT id FROM drivers WHERE user_id = 'REPLACE_WITH_DRIVER_USER_ID')
  -- OR trips assigned via accepted_by (admin reassigned)
  OR accepted_by = 'REPLACE_WITH_DRIVER_USER_ID'
)
ORDER BY created_at DESC
LIMIT 10;
