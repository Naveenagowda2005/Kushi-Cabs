-- Apply Migration 107: Auto-approve when all documents are approved

-- Create function to update verification status based on document approval
CREATE OR REPLACE FUNCTION update_verification_status_on_doc_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_id UUID;
  v_total_docs INT;
  v_approved_docs INT;
  v_required_count INT := 9; -- DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC, AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE
BEGIN
  -- Get driver_id from the updated document
  v_driver_id := NEW.driver_id;
  
  -- Count total documents for this driver
  SELECT COUNT(*) INTO v_total_docs
  FROM driver_documents
  WHERE driver_id = v_driver_id;
  
  -- Count approved documents for this driver
  SELECT COUNT(*) INTO v_approved_docs
  FROM driver_documents
  WHERE driver_id = v_driver_id
  AND status = 'approved';
  
  -- If we have all 9 documents and all are approved, update verification status
  IF v_total_docs >= v_required_count AND v_approved_docs >= v_required_count THEN
    UPDATE driver_verification_status
    SET 
      overall_status = 'approved',
      approved_at = NOW(),
      updated_at = NOW()
    WHERE driver_id = v_driver_id
    AND overall_status != 'approved'; -- Only update if not already approved
    
    RAISE NOTICE 'Driver % automatically approved - all % documents approved', v_driver_id, v_required_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS driver_documents_auto_approve_trigger ON driver_documents;
DROP TRIGGER IF EXISTS driver_documents_auto_approve_on_insert_trigger ON driver_documents;

-- Create trigger to auto-approve when document status is updated to 'approved'
CREATE TRIGGER driver_documents_auto_approve_trigger
AFTER UPDATE OF status ON driver_documents
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION update_verification_status_on_doc_approval();

-- Also handle INSERT for when documents are first created with 'approved' status
CREATE TRIGGER driver_documents_auto_approve_on_insert_trigger
AFTER INSERT ON driver_documents
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION update_verification_status_on_doc_approval();

-- For existing drivers with all documents approved, update them manually NOW
UPDATE driver_verification_status dvs
SET 
  overall_status = 'approved',
  approved_at = NOW(),
  updated_at = NOW()
WHERE overall_status != 'approved'
AND driver_id IN (
  SELECT driver_id
  FROM (
    SELECT 
      driver_id,
      COUNT(*) as total_docs,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_docs
    FROM driver_documents
    GROUP BY driver_id
    HAVING COUNT(*) >= 9
      AND SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) >= 9
  ) approved_drivers
);

-- Verify the update
SELECT 
  dvs.driver_id,
  dvs.overall_status,
  COUNT(dd.id) as doc_count,
  SUM(CASE WHEN dd.status = 'approved' THEN 1 ELSE 0 END) as approved_count
FROM driver_verification_status dvs
LEFT JOIN driver_documents dd ON dvs.driver_id = dd.driver_id
WHERE dvs.overall_status = 'approved'
GROUP BY dvs.driver_id, dvs.overall_status;
