-- ============================================================
-- FIX: vendor_documents RLS policies
-- Migration: 061_fix_vendor_documents_rls.sql
-- ============================================================
-- Problem: vendors get "42501 row-level security policy violation"
-- when trying to INSERT into vendor_documents
-- Cause: RLS policies may not have been applied or are conflicting

-- Drop ALL existing policies on vendor_documents to start clean
DROP POLICY IF EXISTS "vendors_view_own_documents" ON vendor_documents;
DROP POLICY IF EXISTS "vendors_upload_documents" ON vendor_documents;
DROP POLICY IF EXISTS "vendors_update_own_documents" ON vendor_documents;
DROP POLICY IF EXISTS "super_admins_view_all_vendor_documents" ON vendor_documents;
DROP POLICY IF EXISTS "super_admins_verify_vendor_documents" ON vendor_documents;

-- Drop ALL existing policies on vendor_verification_status to start clean
DROP POLICY IF EXISTS "vendors_view_own_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "vendors_insert_own_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "super_admins_view_all_vendor_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "super_admins_insert_vendor_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "super_admins_update_vendor_verification_status" ON vendor_verification_status;

-- Make sure RLS is enabled
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_verification_status ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VENDOR_DOCUMENTS - Recreate clean policies
-- ============================================================

-- SELECT: vendor can read their own docs, super_admin can read all
CREATE POLICY "vendor_docs_select"
  ON vendor_documents FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- INSERT: vendor can insert their own docs
CREATE POLICY "vendor_docs_insert"
  ON vendor_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: vendor can update their own docs, super_admin can update any
CREATE POLICY "vendor_docs_update"
  ON vendor_documents FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- DELETE: super_admin only
CREATE POLICY "vendor_docs_delete"
  ON vendor_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- ============================================================
-- VENDOR_VERIFICATION_STATUS - Recreate clean policies
-- ============================================================

-- SELECT: vendor can read own status, super_admin can read all
CREATE POLICY "vendor_vvs_select"
  ON vendor_verification_status FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- INSERT: vendor can create their own status record, super_admin can insert any
CREATE POLICY "vendor_vvs_insert"
  ON vendor_verification_status FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- UPDATE: vendor can update their own (to submit), super_admin can approve/reject
CREATE POLICY "vendor_vvs_update"
  ON vendor_verification_status FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- ============================================================
-- VERIFY: Show active policies after migration
-- ============================================================
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('vendor_documents', 'vendor_verification_status')
-- ORDER BY tablename, policyname;
