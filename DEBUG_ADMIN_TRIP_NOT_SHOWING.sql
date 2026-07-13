-- Debug: Check why admin trip is not showing to assigned driver

-- 1. Find the most recent admin-created trip
SELECT 
  t.id,
  t.status,
  t.is_admin_trip,
  t.admin_assigned_drivers,
  t.accepted_by,
  t.driver_id,
  t.created_by,
  t.pickup_location,
  t.created_at,
  u.full_name as creator_name,
  u.role_id
FROM trips t
LEFT JOIN users u ON u.id = t.created_by
WHERE t.is_admin_trip = TRUE
ORDER BY t.created_at DESC
LIMIT 1;

-- 2. Get dummy driver info
SELECT 
  u.id as user_id,
  u.full_name,
  u.role_id,
  d.id as driver_id,
  d.user_id,
  u.phone
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.full_name LIKE '%DUMMY%'
LIMIT 1;

-- 3. Check if the trip's admin_assigned_drivers array contains the driver
-- Replace TRIP_ID and DRIVER_USER_ID with values from above
-- SELECT TRIP_ID, DRIVER_USER_ID::uuid = ANY(admin_assigned_drivers) 
-- FROM trips WHERE id = TRIP_ID;

-- 4. Test the RLS policy directly - check what trips a specific driver CAN see
-- (This would require being logged in as that driver)

-- 5. Check current RLS policies on trips table
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'trips'
ORDER BY policyname;

-- 6. Check if admin_assigned_drivers column has the right data type
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trips' AND column_name = 'admin_assigned_drivers';
