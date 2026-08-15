-- ============================================================
-- Fix Driver Trip Visibility
-- Migration: 072_fix_driver_trip_visibility.sql
-- Purpose: Ensure drivers can see trips assigned to them via vendor assignment
-- ============================================================

-- Drop the existing policy that might be preventing visibility
DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;

-- Create updated policy that includes vendor-assigned trips (via accepted_by)
CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    get_my_role() = 'driver' AND (
      -- Pending trips after 5-min visibility window
      (status = 'pending' AND NOW() > vendor_visible_until)
      -- OR trips directly assigned to this driver (by driver_id)
      OR driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
      -- OR trips accepted_by this driver (vendor-assigned trips)
      OR accepted_by = auth.uid()
    )
  );

-- ============================================================
-- Commentary
-- ============================================================
-- This policy allows drivers to see:
-- 1. Pending trips that are published after the 5-minute visibility window
-- 2. Trips where they are the assigned driver (driver_id)
-- 3. Trips where they are the accepted_by user (vendor-assigned trips)
--
-- The third condition ensures that when a vendor assigns a trip to a driver,
-- the driver can immediately see it because accepted_by = driver.user_id
