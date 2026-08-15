-- Diagnose user 2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19
SELECT 
  u.id as user_id,
  u.phone,
  u.email,
  u.verification_status as users_status,
  u.role_id,
  r.name as role_name,
  v.id as vendor_id,
  v.business_name,
  (SELECT COUNT(*) FROM vendor_documents WHERE user_id = u.id) as documents_records,
  vvs.id as vvs_id,
  vvs.overall_status,
  vvs.submitted_at,
  vvs.approved_at
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19';

-- Check if any vendor_verification_status records exist for this vendor
SELECT 
  'STATUS_RECORDS' as check_type,
  COUNT(*) as total_status_records,
  COUNT(CASE WHEN overall_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN overall_status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN overall_status = 'not_started' THEN 1 END) as not_started_count
FROM vendor_verification_status
WHERE user_id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19';

-- Check documents
SELECT 
  'DOCUMENTS' as check_type,
  COUNT(*) as record_count,
  jsonb_object_keys(documents) as document_types
FROM vendor_documents
WHERE user_id = '2cb1e0c9-ec72-42f4-ab63-a0bb319c5b19';
