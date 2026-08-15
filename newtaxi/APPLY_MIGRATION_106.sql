-- ============================================================
-- APPLY MIGRATION 106: DISABLE TRIGGER FOR APPROVED DRIVERS
-- ============================================================
-- Copy and paste this into Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
  current_status verification_status;
BEGIN
  -- Get current verification status
  SELECT overall_status INTO current_status
  FROM driver_verification_status
  WHERE driver_id = NEW.driver_id;

  -- CRITICAL: If driver is already approved, DO NOT change status
  -- This allows approved drivers to re-upload without losing access
  IF current_status = 'approved'::verification_status THEN
    RETURN NEW;
  END IF;

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

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'Migration 106 applied successfully' as status;
