-- ============================================================
-- ROW LEVEL SECURITY POLICIES FOR DRIVER VERIFICATION
-- Migration: 039_driver_verification_rls_policies.sql
-- ============================================================

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_verification_status ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DRIVER_DOCUMENTS POLICIES
-- ============================================================

-- Policy: Drivers can view their own documents
CREATE POLICY "drivers_view_own_documents"
  ON driver_documents
  FOR SELECT
  USING (
    auth.uid() = driver_id
  );

-- Policy: Super admins can view all documents
CREATE POLICY "super_admins_view_all_documents"
  ON driver_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: Drivers can upload their own documents
CREATE POLICY "drivers_upload_documents"
  ON driver_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() = driver_id
  );

-- Policy: Drivers can update their own documents (re-upload)
CREATE POLICY "drivers_update_own_documents"
  ON driver_documents
  FOR UPDATE
  USING (
    auth.uid() = driver_id
  )
  WITH CHECK (
    auth.uid() = driver_id
    AND status = 'pending'  -- Can only update pending documents
  );

-- Policy: Super admins can update document status (verify/reject)
CREATE POLICY "super_admins_verify_documents"
  ON driver_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- ============================================================
-- DRIVER_VERIFICATION_STATUS POLICIES
-- ============================================================

-- Policy: Drivers can view their own verification status
CREATE POLICY "drivers_view_own_verification_status"
  ON driver_verification_status
  FOR SELECT
  USING (
    auth.uid() = driver_id
  );

-- Policy: Super admins can view all verification statuses
CREATE POLICY "super_admins_view_all_verification_status"
  ON driver_verification_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: System can insert verification status records (via trigger)
CREATE POLICY "system_insert_verification_status"
  ON driver_verification_status
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update verification status records (via trigger)
CREATE POLICY "system_update_verification_status"
  ON driver_verification_status
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- USERS TABLE POLICIES - UPDATE FOR VERIFICATION_STATUS
-- ============================================================

-- Policy: Drivers can view their own verification_status
CREATE POLICY "drivers_view_own_verification_status_users"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id
  );

-- Policy: Super admins can view all users' verification_status
CREATE POLICY "super_admins_view_all_users_verification_status"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON POLICY "drivers_view_own_documents" ON driver_documents IS 
  'Drivers can only view their own uploaded documents';

COMMENT ON POLICY "super_admins_view_all_documents" ON driver_documents IS 
  'Super admins can view all driver documents for verification';

COMMENT ON POLICY "drivers_upload_documents" ON driver_documents IS 
  'Drivers can upload documents for their own verification';

COMMENT ON POLICY "drivers_update_own_documents" ON driver_documents IS 
  'Drivers can re-upload their own pending documents';

COMMENT ON POLICY "super_admins_verify_documents" ON driver_documents IS 
  'Super admins can approve or reject driver documents';

COMMENT ON POLICY "drivers_view_own_verification_status" ON driver_verification_status IS 
  'Drivers can view their own overall verification status';

COMMENT ON POLICY "super_admins_view_all_verification_status" ON driver_verification_status IS 
  'Super admins can view all drivers verification statuses';

COMMENT ON POLICY "system_insert_verification_status" ON driver_verification_status IS 
  'System triggers can insert verification status records';

COMMENT ON POLICY "system_update_verification_status" ON driver_verification_status IS 
  'System triggers can update verification status records';
