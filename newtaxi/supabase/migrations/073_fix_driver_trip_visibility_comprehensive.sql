-- ============================================================
-- Comprehensive Fix for Driver Trip Visibility
-- Migration: 073_fix_driver_trip_visibility_comprehensive.sql
-- Purpose: Ensure drivers can see trips assigned to them (accepted_by = user_id)
-- ============================================================

-- First, check if policy exists and drop it
DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;
DROP POLICY IF EXISTS "Drivers see own trips" ON trips;

-- Create a more direct policy that doesn't rely on get_my_role()
-- NOTE: There is NO status restriction for driver_id or accepted_by conditions
-- So drivers CAN see trips in 'accepted', 'in_progress', or any other status
-- if they are assigned via driver_id or accepted_by
CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    -- Check if current user is a driver (via drivers table)
    EXISTS (
      SELECT 1 FROM drivers 
      WHERE user_id = auth.uid()
    )
    AND (
      -- Condition 1: Pending trips after 5-min visibility window (status-specific)
      (status = 'pending' AND NOW() > vendor_visible_until)
      
      -- Condition 2: Trips where driver_id matches this driver (NO status restriction)
      -- Driver can see ANY status if driver_id is set to them
      OR driver_id = (
        SELECT id FROM drivers 
        WHERE user_id = auth.uid() 
        LIMIT 1
      )
      
      -- Condition 3: Trips where accepted_by matches driver's user_id (NO status restriction)
      -- Driver can see ANY status if accepted_by = their user_id (vendor-assigned)
      OR accepted_by = auth.uid()
    )
  );

-- Add index for accepted_by queries (performance)
CREATE INDEX IF NOT EXISTS idx_trips_accepted_by 
ON trips(accepted_by) 
WHERE accepted_by IS NOT NULL;

-- Add index for driver_id queries
CREATE INDEX IF NOT EXISTS idx_trips_driver_id 
ON trips(driver_id) 
WHERE driver_id IS NOT NULL;

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this to verify the policy:
-- 1. Check policy exists:
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'trips' AND policyname = 'Drivers see available and own trips';

-- 2. Check indices exist:
SELECT indexname FROM pg_indexes 
WHERE tablename = 'trips' AND indexname IN ('idx_trips_accepted_by', 'idx_trips_driver_id');

-- ============================================================
-- Key Points
-- ============================================================
-- ✅ Drivers CAN see 'in_progress' trips if driver_id or accepted_by is set
-- ✅ No status restriction on driver_id or accepted_by conditions
-- ✅ Only 'pending' trips have a status + time window restriction
-- ✅ The app's .in('status', ['accepted', 'in_progress']) is NOT an RLS restriction
-- ✅ It's just a query filter in the application code
