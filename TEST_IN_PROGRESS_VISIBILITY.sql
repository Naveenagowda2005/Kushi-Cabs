-- ============================================================
-- Test: Can drivers see IN_PROGRESS trips?
-- ============================================================

-- First, verify the status values exist
SELECT DISTINCT status FROM trips ORDER BY status;

-- Find a trip with in_progress status
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  pickup_location,
  dropoff_location
FROM trips
WHERE status = 'in_progress'
LIMIT 1;

-- ============================================================
-- Test 1: RLS Policy Doesn't Restrict by Status
-- ============================================================
-- The policy allows:
-- 1. Pending trips (after vendor window)
-- 2. Trips where driver_id = this driver
-- 3. Trips where accepted_by = this driver

-- There's NO status restriction in conditions 2 and 3
-- So IN_PROGRESS trips SHOULD be visible if driver_id or accepted_by is set

-- To verify, check the policy:
SELECT 
  policyname,
  SUBSTRING(qual::text, 1, 500) as policy_definition
FROM pg_policies 
WHERE tablename = 'trips' 
  AND policyname = 'Drivers see available and own trips';

-- ============================================================
-- Test 2: Verify accepted_by is being set correctly
-- ============================================================
-- When vendor assigns trip, check the query does:
-- UPDATE trips SET driver_id = ?, accepted_by = ?, status = 'accepted'

-- Check recent assignments:
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  updated_at,
  created_at
FROM trips
WHERE accepted_by IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================
-- Test 3: Can driver query their own trips?
-- ============================================================
-- This simulates what the driver app queries:
-- Replace 'DRIVER-USER-ID' with actual driver ID

SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  pickup_location
FROM trips
WHERE accepted_by = 'DRIVER-USER-ID'
  AND status IN ('accepted', 'in_progress')
LIMIT 5;

-- Expected: Should return trips even if status = 'in_progress'

-- ============================================================
-- Conclusion
-- ============================================================
-- If the above queries return results:
-- ✅ IN_PROGRESS trips ARE visible through RLS
-- ✅ The .in('status', [...]) filter in app is NOT restricting visibility
-- ✅ Problem must be elsewhere (assignment not happening, wrong user_id, etc.)
--
-- If queries return empty:
-- ❌ RLS policy is blocking the query
-- ❌ Must apply migration 072 or 073
