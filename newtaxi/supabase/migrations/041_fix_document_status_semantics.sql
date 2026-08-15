-- ============================================================
-- FIX DOCUMENT STATUS SEMANTICS
-- Migration: 041_fix_document_status_semantics.sql
-- ============================================================
-- Purpose: Add distinction between "uploaded" and "pending_review" statuses
-- This ensures admin dashboard only shows documents that have been submitted for verification

-- ============================================================
-- DROP POLICIES FIRST (they depend on the status column)
-- ============================================================

DROP POLICY IF EXISTS drivers_view_own_documents ON driver_documents;
DROP POLICY IF EXISTS drivers_update_own_documents ON driver_documents;
DROP POLICY IF EXISTS drivers_upload_documents ON driver_documents;
DROP POLICY IF EXISTS super_admins_view_all_documents ON driver_documents;
DROP POLICY IF EXISTS super_admin_view_all_documents ON driver_documents;
DROP POLICY IF EXISTS super_admins_verify_documents ON driver_documents;
DROP POLICY IF EXISTS super_admin_update_documents ON driver_documents;

-- ============================================================
-- UPDATE ENUM to include new status values
-- ============================================================

-- We need to recreate the enum type to add new values
-- First, rename old enum
ALTER TYPE verification_status RENAME TO verification_status_old;

-- Create new enum with all statuses (including 'pending' for backward compatibility during migration)
CREATE TYPE verification_status AS ENUM (
  'pending',            -- Kept for backward compatibility during migration
  'uploaded',           -- Document uploaded but not submitted for verification
  'pending_review',     -- Document submitted and pending admin review
  'approved',           -- Document approved by admin
  'rejected'            -- Document rejected by admin
);

-- Update driver_documents table to use new enum
ALTER TABLE driver_documents 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE verification_status USING status::text::verification_status,
  ALTER COLUMN status SET DEFAULT 'uploaded'::verification_status;

-- Update driver_verification_status table to use new enum
ALTER TABLE driver_verification_status 
  ALTER COLUMN overall_status DROP DEFAULT,
  ALTER COLUMN overall_status TYPE verification_status USING overall_status::text::verification_status,
  ALTER COLUMN overall_status SET DEFAULT 'pending_review'::verification_status;

-- Drop old enum type
DROP TYPE verification_status_old;

-- ============================================================
-- UPDATE EXISTING DATA
-- ============================================================

-- Convert all old 'pending' status to 'pending_review' (documents already submitted)
UPDATE driver_documents 
SET status = 'pending_review'::verification_status
WHERE status = 'pending'::verification_status;

-- Convert all old 'pending' status to 'pending_review' in verification table
UPDATE driver_verification_status 
SET overall_status = 'pending_review'::verification_status
WHERE overall_status = 'pending'::verification_status;

-- ============================================================
-- RECREATE POLICIES
-- ============================================================

-- Policy: Drivers can only view their own documents
CREATE POLICY drivers_view_own_documents ON driver_documents
  FOR SELECT
  USING (auth.uid() = driver_id);

-- Policy: Drivers can only update their own documents (only if status is 'uploaded')
CREATE POLICY drivers_update_own_documents ON driver_documents
  FOR UPDATE
  USING (auth.uid() = driver_id AND status = 'uploaded'::verification_status)
  WITH CHECK (auth.uid() = driver_id);

-- Policy: Drivers can insert their own documents
CREATE POLICY drivers_upload_documents ON driver_documents
  FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Policy: Super admin can view all documents
CREATE POLICY super_admins_view_all_documents ON driver_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: Super admin can update all documents (for approval/rejection)
CREATE POLICY super_admins_verify_documents ON driver_documents
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
-- UPDATE TRIGGERS
-- ============================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;

-- Recreate trigger with new logic
CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
BEGIN
  -- Count documents by status
  SELECT 
    COUNT(DISTINCT document_type) FILTER (WHERE status IN ('pending_review'::verification_status, 'approved'::verification_status)),
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'approved'::verification_status),
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'rejected'::verification_status)
  INTO submitted_count, approved_count, rejected_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
  -- Determine new status
  IF rejected_count > 0 THEN
    new_status := 'rejected'::verification_status;
  ELSIF approved_count = total_required THEN
    new_status := 'approved'::verification_status;
  ELSIF submitted_count > 0 THEN
    new_status := 'pending_review'::verification_status;
  ELSE
    new_status := 'pending_review'::verification_status;
  END IF;
  
  -- Update verification status
  UPDATE driver_verification_status
  SET overall_status = new_status,
      approved_at = CASE WHEN new_status = 'approved' AND approved_at IS NULL THEN NOW() ELSE approved_at END,
      rejected_at = CASE WHEN new_status = 'rejected' AND rejected_at IS NULL THEN NOW() ELSE rejected_at END
  WHERE driver_id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_overall_verification_status
  AFTER INSERT OR UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_overall_verification_status();

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TYPE verification_status IS 'Verification status: uploaded (ready to submit), pending_review (submitted and waiting), approved (verified), rejected (not approved)';
