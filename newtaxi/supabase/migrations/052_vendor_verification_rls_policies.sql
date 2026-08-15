-- ============================================================
-- ROW LEVEL SECURITY POLICIES FOR VENDOR VERIFICATION
-- Migration: 052_vendor_verification_rls_policies.sql
-- ============================================================

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_verification_status ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VENDOR_DOCUMENTS POLICIES
-- ============================================================

-- Policy: Vendors can view their own documents
CREATE POLICY "vendors_view_own_documents"
  ON vendor_documents
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Policy: Super admins can view all documents
CREATE POLICY "super_admins_view_all_vendor_documents"
  ON vendor_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: Vendors can upload their own documents
CREATE POLICY "vendors_upload_documents"
  ON vendor_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy: Vendors can update their own documents (re-upload)
CREATE POLICY "vendors_update_own_documents"
  ON vendor_documents
  FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy: Super admins can update document status (verify/reject)
CREATE POLICY "super_admins_verify_vendor_documents"
  ON vendor_documents
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
-- VENDOR_VERIFICATION_STATUS POLICIES
-- ============================================================

-- Policy: Vendors can view their own verification status
CREATE POLICY "vendors_view_own_verification_status"
  ON vendor_verification_status
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Policy: Super admins can view all verification statuses
CREATE POLICY "super_admins_view_all_vendor_verification_status"
  ON vendor_verification_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: Super admins can insert verification status records
CREATE POLICY "super_admins_insert_vendor_verification_status"
  ON vendor_verification_status
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: Super admins can update verification status records
CREATE POLICY "super_admins_update_vendor_verification_status"
  ON vendor_verification_status
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
-- USERS TABLE POLICIES - UPDATE FOR VERIFICATION_STATUS (Vendors)
-- ============================================================

-- Policy: Vendors can view their own verification_status
CREATE POLICY "vendors_view_own_verification_status_users"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id
  );

-- Policy: Super admins can update users' verification_status (for vendors)
CREATE POLICY "super_admins_update_vendor_verification_status_users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON POLICY "vendors_view_own_documents" ON vendor_documents IS 
  'Vendors can only view their own uploaded documents';

COMMENT ON POLICY "super_admins_view_all_vendor_documents" ON vendor_documents IS 
  'Super admins can view all vendor documents for verification';

COMMENT ON POLICY "vendors_upload_documents" ON vendor_documents IS 
  'Vendors can upload documents for their own verification';

COMMENT ON POLICY "vendors_update_own_documents" ON vendor_documents IS 
  'Vendors can re-upload their own documents';

COMMENT ON POLICY "super_admins_verify_vendor_documents" ON vendor_documents IS 
  'Super admins can approve or reject vendor documents';

COMMENT ON POLICY "vendors_view_own_verification_status" ON vendor_verification_status IS 
  'Vendors can view their own overall verification status';

COMMENT ON POLICY "super_admins_view_all_vendor_verification_status" ON vendor_verification_status IS 
  'Super admins can view all vendors verification statuses';

COMMENT ON POLICY "super_admins_insert_vendor_verification_status" ON vendor_verification_status IS 
  'Super admins can insert vendor verification status records';

COMMENT ON POLICY "super_admins_update_vendor_verification_status" ON vendor_verification_status IS 
  'Super admins can update vendor verification status records';
