-- ============================================================
-- ADD NEW DOCUMENT TYPES FOR DRIVER VERIFICATION
-- Migration: 043_add_new_document_types.sql
-- ============================================================
-- Purpose: Add 3 new document types to driver verification
-- New documents: AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE

-- ============================================================
-- UPDATE ENUM to add new document types
-- ============================================================

-- Rename old enum
ALTER TYPE driver_document_type RENAME TO driver_document_type_old;

-- Create new enum with additional document types
CREATE TYPE driver_document_type AS ENUM (
  'DL',                    -- Driver's License
  'VEHICLE_FRONT',         -- Vehicle Front Photo
  'INSURANCE',             -- Insurance Certificate
  'FC',                    -- Fitness Certificate
  'EMISSION',              -- Emission Certificate
  'RC',                    -- Registration Certificate
  'AADHAR',                -- Aadhar ID (New)
  'BANK_PASSBOOK_FRONT',   -- Bank Passbook Front Photo (New)
  'DRIVER_SELFIE'          -- Driver Selfie (New)
);

-- Update driver_documents table to use new enum
ALTER TABLE driver_documents 
  ALTER COLUMN document_type TYPE driver_document_type USING document_type::text::driver_document_type;

-- Drop old enum type
DROP TYPE driver_document_type_old;

-- ============================================================
-- UPDATE TRIGGER TO ACCOUNT FOR 9 DOCUMENTS
-- ============================================================

-- Drop old trigger that checks for 6 documents
DROP TRIGGER IF EXISTS trg_check_all_documents_submitted ON driver_documents;

-- Recreate trigger with 9 required documents
CREATE OR REPLACE FUNCTION check_all_documents_submitted()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 9;  -- Updated from 6 to 9
  submitted_count INTEGER;
BEGIN
  -- Count submitted documents for this driver
  SELECT COUNT(DISTINCT document_type) INTO submitted_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
  -- Update the verification status
  UPDATE driver_verification_status
  SET all_documents_submitted = (submitted_count >= total_required),
      submitted_at = CASE 
        WHEN submitted_count >= total_required AND submitted_at IS NULL 
        THEN NOW() 
        ELSE submitted_at 
      END
  WHERE driver_id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_all_documents_submitted
  AFTER INSERT OR UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION check_all_documents_submitted();

-- ============================================================
-- UPDATE OVERALL VERIFICATION TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;

CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 9;  -- Updated from 6 to 9
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

COMMENT ON TYPE driver_document_type IS 'Driver document types: DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC, AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE';
