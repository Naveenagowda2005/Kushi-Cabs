-- ============================================================
-- ADD IS_RE_VERIFICATION FLAG TO DRIVER VERIFICATION
-- Migration: 069_driver_re_verification_flag.sql
-- ============================================================

-- Add is_re_verification flag to driver_verification_status table
ALTER TABLE driver_verification_status
ADD COLUMN IF NOT EXISTS is_re_verification BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN driver_verification_status.is_re_verification IS 
  'TRUE when a driver who was already approved (or rejected) re-uploaded documents';

-- ============================================================
-- UPDATE TRIGGER FOR DRIVER RE-VERIFICATION DETECTION
-- ============================================================

-- Create or replace function to detect driver re-verification
CREATE OR REPLACE FUNCTION detect_driver_re_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any approved documents for this driver
  -- If yes, mark this re-submission as re_verification = TRUE
  IF NEW.driver_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM driver_documents 
      WHERE driver_id = NEW.driver_id 
      AND status = 'approved'
      LIMIT 1
    ) THEN
      NEW.is_re_verification := TRUE;
    ELSE
      NEW.is_re_verification := FALSE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set is_re_verification on verification status insert/update
DROP TRIGGER IF EXISTS trigger_detect_driver_re_verification ON driver_verification_status;
CREATE TRIGGER trigger_detect_driver_re_verification
BEFORE INSERT OR UPDATE ON driver_verification_status
FOR EACH ROW
EXECUTE FUNCTION detect_driver_re_verification();

-- ============================================================
-- UPDATE EXISTING RECORDS
-- ============================================================

-- Mark existing pending/rejected drivers with any approved docs as re_verification = TRUE
UPDATE driver_verification_status dvs
SET is_re_verification = TRUE
WHERE overall_status IN ('pending', 'rejected')
AND EXISTS (
  SELECT 1 FROM driver_documents
  WHERE driver_id = dvs.driver_id
  AND status = 'approved'
  LIMIT 1
);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON FUNCTION detect_driver_re_verification IS 
  'Automatically sets is_re_verification flag when a driver re-submits after being previously approved';
