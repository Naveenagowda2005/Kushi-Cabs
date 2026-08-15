-- ============================================================
-- FIX DOCUMENT DATA TYPE
-- Migration: 040_fix_document_data_type.sql
-- ============================================================
-- Change document_data column from BYTEA to TEXT to store base64 strings

-- Drop dependent triggers and functions first
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;
DROP FUNCTION IF EXISTS update_overall_verification_status();

DROP TRIGGER IF EXISTS trg_check_all_documents_submitted ON driver_documents;
DROP FUNCTION IF EXISTS check_all_documents_submitted();

DROP TRIGGER IF EXISTS trg_create_verification_status ON driver_documents;
DROP FUNCTION IF EXISTS create_verification_status_for_driver();

-- Alter the column type
ALTER TABLE driver_documents
ALTER COLUMN document_data TYPE TEXT;

-- Recreate the functions and triggers

-- Trigger: Auto-create verification status record when driver document is uploaded
CREATE OR REPLACE FUNCTION create_verification_status_for_driver()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO driver_verification_status (driver_id)
  VALUES (NEW.driver_id)
  ON CONFLICT (driver_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_verification_status
  AFTER INSERT ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION create_verification_status_for_driver();

-- Trigger: Update verification status when all documents are submitted
CREATE OR REPLACE FUNCTION check_all_documents_submitted()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;  -- DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC
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

-- Trigger: Update overall verification status based on document statuses
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
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'approved'),
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'rejected'),
    COUNT(DISTINCT document_type)
  INTO approved_count, rejected_count, submitted_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
  -- Determine new status
  IF rejected_count > 0 THEN
    new_status := 'rejected'::verification_status;
  ELSIF approved_count = total_required THEN
    new_status := 'approved'::verification_status;
  ELSE
    new_status := 'pending'::verification_status;
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
COMMENT ON COLUMN driver_documents.document_data IS 'Base64 encoded image data stored as TEXT';
