-- ============================================================
-- Apply Fix: Driver Trip Visibility After Assignment
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop old policies
DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;
DROP POLICY IF EXISTS "Drivers see own trips" ON trips;

-- Step 2: Create new RLS policy that doesn't rely on get_my_role()
CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    -- Check if current user is a driver (more reliable than get_my_role())
    EXISTS (
      SELECT 1 FROM drivers 
      WHERE user_id = auth.uid()
    )
    AND (
      -- Condition 1: Pending trips after 5-min visibility window
      (status = 'pending' AND NOW() > vendor_visible_until)
      
      -- Condition 2: Trips where driver_id matches this driver
      OR driver_id = (
        SELECT id FROM drivers 
        WHERE user_id = auth.uid() 
        LIMIT 1
      )
      
      -- Condition 3: Trips where accepted_by matches driver's user_id (VENDOR-ASSIGNED)
      OR accepted_by = auth.uid()
    )
  );

-- Step 3: Create indices for performance
CREATE INDEX IF NOT EXISTS idx_trips_accepted_by 
ON trips(accepted_by) 
WHERE accepted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_driver_id 
ON trips(driver_id) 
WHERE driver_id IS NOT NULL;

-- ============================================================
-- Verification
-- ============================================================

-- Verify policy was created
SELECT 
  policyname, 
  cmd,
  SUBSTRING(qual::text, 1, 150) as policy_condition
FROM pg_policies 
WHERE tablename = 'trips' 
  AND policyname = 'Drivers see available and own trips';

-- Verify indices exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename = 'trips' 
  AND indexname IN ('idx_trips_accepted_by', 'idx_trips_driver_id');

-- ============================================================
-- Test Query (Replace [DRIVER-USER-ID] with actual ID)
-- ============================================================

-- This query tests if a driver can see their assigned trips:
-- SELECT id, status, driver_id, accepted_by, 
--        pickup_location, dropoff_location
-- FROM trips
-- WHERE accepted_by = '[DRIVER-USER-ID]'
--   AND status IN ('accepted', 'in_progress');

-- Expected: Should return assigned trips (not empty if trips assigned)

-- ============================================================
-- Summary of Changes
-- ============================================================
/*
1. ✅ Dropped old/broken RLS policies
2. ✅ Created new policy that checks driver existence directly
3. ✅ Policy now allows drivers to see:
   - Pending trips after vendor window
   - Trips with driver_id set to this driver
   - Trips with accepted_by = driver's user_id (VENDOR-ASSIGNED)
4. ✅ Added indices for performance

Next Steps:
- Verify policy and indices created successfully
- Restart driver app
- Vendor assigns trip to driver
- Driver should now see trip on dashboard
*/
