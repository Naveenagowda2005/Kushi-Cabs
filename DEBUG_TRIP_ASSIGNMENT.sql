-- DEBUG: Check trip assignment in database
-- Run this to verify trips are being assigned correctly

-- 1. Check recent trips with assignments
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  created_by,
  pickup_location,
  dropoff_location,
  created_at,
  updated_at
FROM trips
WHERE status IN ('accepted', 'in_progress')
  AND (driver_id IS NOT NULL OR accepted_by IS NOT NULL)
ORDER BY updated_at DESC
LIMIT 10;

-- 2. Check driver info
SELECT 
  id,
  user_id,
  vehicle_number,
  is_online,
  license_number
FROM drivers
LIMIT 5;

-- 3. Check users table
SELECT 
  id,
  full_name,
  phone,
  verification_status,
  is_active
FROM users
WHERE role = 'driver'
LIMIT 5;

-- 4. Check RLS policy
SELECT * FROM pg_policies WHERE tablename = 'trips' AND policyname LIKE '%Drivers%';

-- 5. Test RLS: Can driver see their own assigned trip? (replace with actual IDs)
-- This will show what a specific driver can see
-- UPDATE: Replace 'driver-user-id-here' with actual driver user ID
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  pickup_location,
  dropoff_location
FROM trips
WHERE accepted_by = 'driver-user-id-here'  -- Replace with actual driver user ID
  AND status IN ('accepted', 'in_progress');
