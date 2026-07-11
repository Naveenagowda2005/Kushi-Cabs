-- ============================================================
-- Migration: Add admin_trip_assignments table for tracking
-- admin-created trips assigned to specific drivers
-- ============================================================

-- Create admin_trip_assignments table
CREATE TABLE IF NOT EXISTS admin_trip_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id),
  
  -- Track if driver has seen/accepted this admin-assigned trip
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_trip_assignments ENABLE ROW LEVEL SECURITY;

-- Create indices for faster queries
CREATE INDEX idx_admin_trip_assignments_trip_id ON admin_trip_assignments(trip_id);
CREATE INDEX idx_admin_trip_assignments_driver_id ON admin_trip_assignments(driver_id);

-- Policy: Allow super admin to view all assignments
CREATE POLICY "super_admin_view_all_assignments"
  ON admin_trip_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users 
    WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
  ));

-- Policy: Allow drivers to view their assigned trips
CREATE POLICY "driver_view_own_assignments"
  ON admin_trip_assignments
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Policy: Allow admin to create assignments
CREATE POLICY "admin_create_assignments"
  ON admin_trip_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_by IN (
      SELECT id FROM users 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: Allow admin to update assignments (e.g., mark as viewed)
CREATE POLICY "admin_update_assignments"
  ON admin_trip_assignments
  FOR UPDATE
  TO authenticated
  USING (
    assigned_by IN (
      SELECT id FROM users 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Add columns to trips table if they don't exist
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_admin_trip BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS admin_assigned_drivers UUID[] DEFAULT '{}';

-- Create index for finding admin-created trips
CREATE INDEX IF NOT EXISTS idx_trips_is_admin_trip ON trips(is_admin_trip) WHERE is_admin_trip = TRUE;

-- Ensure we can query trips where driver is in admin_assigned_drivers array
CREATE INDEX IF NOT EXISTS idx_trips_admin_assigned_drivers ON trips USING GIN(admin_assigned_drivers);

COMMENT ON TABLE admin_trip_assignments IS 'Tracks which drivers are assigned to admin-created trips';
COMMENT ON COLUMN trips.is_admin_trip IS 'Whether this trip was created by super admin (TRUE) or vendor (FALSE)';
COMMENT ON COLUMN trips.admin_assigned_drivers IS 'Array of driver UUIDs assigned to this admin trip';
