-- ============================================================
-- RUN THIS NOW IN SUPABASE SQL EDITOR
-- Fixes: vendor_documents RLS + vendor approval for stuck users
-- ============================================================

-- PART 1: Fix RLS policies for vendor_documents
-- ============================================================

-- Drop old policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "vendors_view_own_documents" ON vendor_documents;
DROP POLICY IF EXISTS "vendors_upload_documents" ON vendor_documents;
DROP POLICY IF EXISTS "vendors_update_own_documents" ON vendor_documents;
DROP POLICY IF EXISTS "super_admins_view_all_vendor_documents" ON vendor_documents;
DROP POLICY IF EXISTS "super_admins_verify_vendor_documents" ON vendor_documents;
DROP POLICY IF EXISTS "vendor_docs_select" ON vendor_documents;
DROP POLICY IF EXISTS "vendor_docs_insert" ON vendor_documents;
DROP POLICY IF EXISTS "vendor_docs_update" ON vendor_documents;
DROP POLICY IF EXISTS "vendor_docs_delete" ON vendor_documents;

-- Ensure RLS is enabled
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read their own docs, super_admin reads all
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

-- INSERT: any authenticated user can insert a row where user_id = their own uid
CREATE POLICY "vendor_docs_insert"
  ON vendor_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: own row or super_admin
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

-- PART 2: Fix RLS policies for vendor_verification_status
-- ============================================================

DROP POLICY IF EXISTS "vendors_view_own_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "vendors_insert_own_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "super_admins_view_all_vendor_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "super_admins_insert_vendor_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "super_admins_update_vendor_verification_status" ON vendor_verification_status;
DROP POLICY IF EXISTS "vendor_vvs_select" ON vendor_verification_status;
DROP POLICY IF EXISTS "vendor_vvs_insert" ON vendor_verification_status;
DROP POLICY IF EXISTS "vendor_vvs_update" ON vendor_verification_status;

ALTER TABLE vendor_verification_status ENABLE ROW LEVEL SECURITY;

-- SELECT
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

-- INSERT: vendor can create own record, super_admin can insert any
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

-- UPDATE: vendor can update own, super_admin can update any
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

-- PART 3: Approve the stuck vendor (user 2cb1e0c9...)
-- ============================================================

-- Create or update approval record for the stuck vendor
INSERT INTO vendor_verification_status (
  vendor_id,
  user_id,
  overall_status,
  all_documents_submitted,
  submitted_at,
  approved_at,
  created_at,
  updated_at
)
SELECT 
  v.id,
  u.id,
  'approved',
  true,
  NOW(),
  NOW(),
  NOW(),
  NOW()
FROM users u
JOIN vendors v ON u.id = v.user_id
WHERE u.id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19'
ON CONFLICT (user_id) DO UPDATE SET
  overall_status = 'approved',
  approved_at = NOW(),
  all_documents_submitted = true,
  updated_at = NOW();

-- Update users table too
UPDATE users
SET verification_status = 'approved'
WHERE id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19';

-- PART 4: Verify everything is correct
-- ============================================================

SELECT 
  u.phone,
  u.verification_status AS users_status,
  vvs.overall_status,
  vvs.approved_at,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vendor_documents') AS vendor_doc_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vendor_verification_status') AS vvs_policies
FROM users u
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19';
