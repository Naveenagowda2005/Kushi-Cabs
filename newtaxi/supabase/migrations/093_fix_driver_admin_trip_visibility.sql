-- Migration 093: Fix driver visibility for admin-reassigned trips
-- This allows drivers to see admin-created trips where they've been reassigned via accepted_by field

-- Drop the old "Drivers see available and own trips" policy
DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;

-- Create new comprehensive policy that includes admin-reassigned trips
CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    -- User must be a driver
    EXISTS (
      SELECT 1 FROM drivers 
      WHERE user_id = auth.uid()
    )
    AND (
      -- Condition 1: Pending vendor trips (after 5-min visibility window)
      (status = 'pending' AND is_admin_trip = FALSE AND NOW() > vendor_visible_until)
      
      -- Condition 2: Trips where driver_id matches this driver (vendor-assigned, any status)
      OR driver_id = (
        SELECT id FROM drivers 
        WHERE user_id = auth.uid() 
        LIMIT 1
      )
      
      -- Condition 3: Trips where accepted_by matches driver's user_id (any status, any trip type)
      -- This covers both vendor-assigned trips AND admin-reassigned trips
      OR accepted_by = auth.uid()
      
      -- Condition 4: Admin-created trips where driver is in admin_assigned_drivers array (NEW)
      -- This allows drivers to see admin trips they're assigned to (before they accept)
      OR (
        is_admin_trip = TRUE 
        AND auth.uid() = ANY(admin_assigned_drivers)
        AND status = 'pending'  -- Only pending admin trips (not yet accepted)
      )
    )
  );

COMMENT ON POLICY "Drivers see available and own trips" ON trips IS 
'Allows drivers to see: 
1. Pending vendor trips after 5-min visibility window
2. Any trip where they are assigned as driver
3. Any trip where they are the acceptor
4. Pending admin trips where they are in the admin_assigned_drivers array';
