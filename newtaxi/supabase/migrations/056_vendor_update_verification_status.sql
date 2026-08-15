-- ============================================================
-- FIX: Allow vendors to UPDATE their own verification status
-- Migration: 056_vendor_update_verification_status.sql
-- ============================================================
-- PROBLEM: Vendors couldn't re-submit after rejection because they
-- lacked UPDATE permission on vendor_verification_status.
-- The handleSubmitForVerification fallback .update() silently failed.
-- SOLUTION: Add policy allowing vendors to update their own record
-- back to 'pending' status.

-- Policy: Vendors can update their own verification status (for re-submission)
CREATE POLICY "vendors_update_own_verification_status"
  ON vendor_verification_status
  FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

COMMENT ON POLICY "vendors_update_own_verification_status" ON vendor_verification_status IS
  'Vendors can update their own verification status record to re-submit documents after rejection';
