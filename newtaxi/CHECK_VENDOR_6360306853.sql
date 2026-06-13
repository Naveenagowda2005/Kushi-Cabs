-- Check vendor status for phone 6360306853
SELECT 
  u.id as user_id,
  u.phone,
  u.email,
  u.verification_status as user_verification_status,
  u.role_id,
  r.name as role_name,
  v.id as vendor_id,
  v.business_name,
  vvs.overall_status,
  vvs.all_documents_submitted,
  vvs.submitted_at,
  vvs.approved_at,
  vvs.rejected_at,
  vvs.verified_by,
  vvs.created_at as vvs_created_at,
  vvs.updated_at as vvs_updated_at
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.phone = '6360306853' OR u.phone LIKE '%6360306853%';

-- Check if document records exist
SELECT 
  vd.id,
  vd.user_id,
  vd.vendor_id,
  vd.created_at,
  vd.updated_at,
  jsonb_object_keys(vd.documents) as document_types
FROM vendor_documents vd
WHERE vd.user_id IN (
  SELECT u.id FROM users u WHERE u.phone = '6360306853'
);
