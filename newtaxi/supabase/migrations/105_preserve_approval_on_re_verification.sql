-- ============================================================
-- PRESERVE APPROVAL STATUS ON RE-VERIFICATION
-- Migration: 105_preserve_approval_on_re_verification.sql
-- ============================================================
-- Problem: When an already-approved driver re-uploads a document,
-- the trigger update_overall_verification_status() sees the new
-- document as 'pending' and reverts the overall_status to 'pending',
-- blocking the driver from the dashboard.
--
-- Solution: Track re-verification flag and don't change overall_status
-- if driver is already approved and just re-uploading for verification.
-- ============================================================

-- ============================================================
-- UPDATE TRIGGER FOR VERIFICATION STATUS
-- ============================================================

-- Recreate the trigger to preserve approval status during re-verification
CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
  current_status verification_status;
  is_re_verification BOOLEAN;
BEGIN
  -- Get current verification status and re_verification flag
  SELECT overall_status, is_re_verification INTO current_status, is_re_verification
  FROM driver_verification_status
  WHERE driver_id = NEW.driver_id;

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
    -- If any document is pending/rejected, status is pending
    new_status := 'pending'::verification_status;
  END IF;
  
  -- CRITICAL: Preserve approval status during re-verification
  -- If driver is already approved and this looks like a re-upload:
  -- - Don't revert to pending just because new documents are pending review
  -- - Keep them on the dashboard until admin explicitly rejects
  IF current_status = 'approved'::verification_status AND is_re_verification = TRUE THEN
    -- During re-verification, only change status if all new docs become approved
    -- Or if an admin explicitly rejects them
    -- For now, keep the approved status
    IF new_status != 'approved'::verification_status AND new_status != 'rejected'::verification_status THEN
      new_status := 'approved'::verification_status;
    END IF;
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

-- The trigger already exists, so DROP and recreate
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;
CREATE TRIGGER trg_update_overall_verification_status
  AFTER INSERT OR UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_overall_verification_status();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON FUNCTION update_overall_verification_status IS 
  'Updates overall verification status based on document statuses. 
   During re-verification, preserves approved status to keep driver 
   access to dashboard while admin reviews re-submitted documents.';

