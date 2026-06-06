-- ============================================================
-- FIX: Allow vendors to insert their own verification status
-- Migration: 055_fix_vendor_insert_verification_status.sql
-- ============================================================
-- PROBLEM: Vendors couldn't submit documents because they lacked 
-- permission to insert vendor_verification_status records
-- SOLUTION: Add policy allowing vendors to insert their own records

-- ============================================================
-- ADD NEW POLICY FOR VENDORS TO INSERT
-- ============================================================

-- Policy: Vendors can insert their own verification status record
CREATE POLICY "vendors_insert_own_verification_status"
  ON vendor_verification_status
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- ============================================================
-- COMMENT
-- ============================================================

COMMENT ON POLICY "vendors_insert_own_verification_status" ON vendor_verification_status IS 
  'Vendors can create their own verification status record when submitting documents for verification';
