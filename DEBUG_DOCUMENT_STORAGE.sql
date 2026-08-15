-- Debug: Check driver_documents table for the specific driver
SELECT 
  id,
  driver_id,
  document_type,
  status,
  uploaded_at,
  created_at,
  updated_at
FROM driver_documents
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'
ORDER BY document_type;

-- Count all driver documents
SELECT 
  COUNT(*) as total_documents,
  COUNT(DISTINCT driver_id) as total_drivers,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
FROM driver_documents;

-- Check driver_verification_status for this driver
SELECT 
  id,
  driver_id,
  overall_status,
  all_documents_submitted,
  submitted_at,
  created_at,
  updated_at
FROM driver_verification_status
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- Check if super admin has correct role
SELECT 
  u.id,
  u.phone,
  u.role_id,
  r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.phone = 'SUPER_ADMIN_PHONE_NUMBER'
LIMIT 1;
