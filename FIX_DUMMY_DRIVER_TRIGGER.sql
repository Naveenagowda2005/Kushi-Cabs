-- Fix: Modify trigger to exempt dummy driver (phone: 8050017071) from auto-verification
-- Dummy driver should remain approved and not be recalculated by the trigger

-- Step 1: Update the trigger function to skip dummy drivers
CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
  is_dummy_driver BOOLEAN;
BEGIN
  -- Check if this is the dummy driver (phone: 8050017071)
  SELECT (u.phone = '8050017071') INTO is_dummy_driver
  FROM users u
  WHERE u.id = NEW.driver_id;
  
  -- If it's the dummy driver, don't auto-calculate, leave as-is
  IF is_dummy_driver THEN
    RETURN NEW;
  END IF;
  
  -- Count documents by status for non-dummy drivers
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

-- Step 2: Ensure dummy driver has 'approved' status in users table
UPDATE users
SET verification_status = 'approved'
WHERE phone = '8050017071';

-- Step 3: Ensure dummy driver has 'approved' status in driver_verification_status table
UPDATE driver_verification_status
SET overall_status = 'approved'
WHERE driver_id = (SELECT id FROM users WHERE phone = '8050017071');

-- Step 4: Verify the changes
SELECT 
  u.id, u.full_name, u.phone, u.verification_status,
  dvs.overall_status
FROM users u
LEFT JOIN driver_verification_status dvs ON u.id = dvs.driver_id
WHERE u.phone = '8050017071';
