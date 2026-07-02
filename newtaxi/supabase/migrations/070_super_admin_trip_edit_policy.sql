-- ============================================================
-- Migration 070: Allow Super Admin to Edit Admin-Created Trips Only
-- ============================================================
-- This migration adds RLS policies to allow super_admin role to:
-- - Edit trips created by admin users only
-- - Delete admin-created trips if needed
-- - NOT edit vendor or driver-created trips
-- ============================================================

-- Add UPDATE policy for super_admin to edit ONLY admin-created trips
CREATE POLICY "Super admin can update admin-created trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (
    -- Super admin can only update trips created by admin users
    get_my_role() = 'super_admin'
    AND created_by IN (
      SELECT u.id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'admin'
    )
  )
  WITH CHECK (
    -- Super admin can only update trips created by admin users
    get_my_role() = 'super_admin'
    AND created_by IN (
      SELECT u.id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'admin'
    )
  );

-- Add DELETE policy for super_admin to delete admin-created trips if needed
CREATE POLICY "Super admin can delete admin-created trips"
  ON trips FOR DELETE
  TO authenticated
  USING (
    -- Super admin can only delete trips created by admin users
    get_my_role() = 'super_admin'
    AND created_by IN (
      SELECT u.id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'admin'
    )
  );

-- ============================================================
-- Policy priority for trips UPDATE:
-- 1. Super admin - can edit only admin-created trips (this policy)
-- 2. Admin - full access to own trips (existing policy)
-- 3. Vendors - can update only their accepted trips
-- 4. Drivers - can update only their assigned trips
-- ============================================================

COMMENT ON POLICY "Super admin can update admin-created trips" ON trips IS 
'Allows super_admin role to edit only trips created by admin users. Prevents editing vendor or driver trips.';

COMMENT ON POLICY "Super admin can delete admin-created trips" ON trips IS 
'Allows super_admin role to delete only trips created by admin users. Prevents deleting vendor or driver trips.';
