-- DEBUG: Check what's actually in driver_verification_status table
SELECT 
  id,
  driver_id,
  overall_status,
  all_documents_submitted,
  submitted_at,
  created_at,
  updated_at
FROM driver_verification_status
ORDER BY updated_at DESC
LIMIT 20;

-- Check document statuses too
SELECT 
  id,
  driver_id,
  document_type,
  status,
  updated_at
FROM driver_documents
WHERE driver_id IN (
  SELECT driver_id FROM driver_verification_status ORDER BY updated_at DESC LIMIT 5
)
ORDER BY updated_at DESC;

-- Count by status
SELECT 
  overall_status,
  COUNT(*) as count
FROM driver_verification_status
GROUP BY overall_status;

-- Check if there's a 'pending' or 'submitted' status
SELECT DISTINCT overall_status
FROM driver_verification_status;
