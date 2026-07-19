-- Permanent fix: Disable the trigger for dummy driver completely
-- The trigger keeps resetting verification_status to 'pending'

-- Step 1: Drop all related triggers that recalculate verification status
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;
DROP TRIGGER IF EXISTS trg_check_all_documents_submitted ON driver_documents;

-- Step 2: Create new trigger functions that skip dummy driver (phone: 8050017071)

-- New function for checking all documents (skip dummy)
CREATE OR REPLACE FUNCTION check_all_documents_submitted()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;  -- DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC
  submitted_count INTEGER;
  is_dummy BOOLEAN;
BEGIN
  -- Check if dummy driver
  SELECT (u.phone = '8050017071') INTO is_dummy
  FROM users u WHERE u.id = NEW.driver_id;
  
  IF is_dummy THEN
    RETURN NEW;  -- Skip for dummy driver
  END IF;
  
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

-- New function for updating overall status (skip dummy)
CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
  is_dummy BOOLEAN;
BEGIN
  -- Check if dummy driver
  SELECT (u.phone = '8050017071') INTO is_dummy
  FROM users u WHERE u.id = NEW.driver_id;
  
  IF is_dummy THEN
    RETURN NEW;  -- Skip for dummy driver - it stays approved
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

-- Step 3: Recreate the triggers with new functions
CREATE TRIGGER trg_check_all_documents_submitted
  AFTER INSERT OR UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION check_all_documents_submitted();

CREATE TRIGGER trg_update_overall_verification_status
  AFTER INSERT OR UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_overall_verification_status();

-- Step 4: Force set dummy driver to approved in all tables
UPDATE users
SET verification_status = 'approved'
WHERE phone = '8050017071';

UPDATE driver_verification_status
SET overall_status = 'approved'
WHERE driver_id = (SELECT id FROM users WHERE phone = '8050017071');

-- Step 5: Verify the fix
SELECT 
  verification_status,
  COUNT(*) as count
FROM users
WHERE role_id = 3
GROUP BY verification_status
ORDER BY verification_status;
