-- Check driver_verification_status table for pending_review records
SELECT 
  id,
  driver_id,
  overall_status,
  all_documents_submitted,
  submitted_at,
  created_at
FROM driver_verification_status
WHERE overall_status = 'pending_review'
ORDER BY submitted_at DESC
LIMIT 20;

-- Check driver_documents for all documents
SELECT 
  id,
  driver_id,
  document_type,
  status,
  document_data IS NOT NULL as has_data,
  created_at
FROM driver_documents
ORDER BY created_at DESC
LIMIT 50;

-- Check how many drivers have documents at all
SELECT 
  COUNT(DISTINCT driver_id) as total_drivers_with_docs,
  COUNT(*) as total_documents
FROM driver_documents;

-- Get detailed breakdown by document status
SELECT 
  status,
  document_type,
  COUNT(*) as count
FROM driver_documents
GROUP BY status, document_type
ORDER BY status, document_type;
