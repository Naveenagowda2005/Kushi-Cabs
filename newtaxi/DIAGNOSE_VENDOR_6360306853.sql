-- Step 1: Find user by phone
WITH user_lookup AS (
  SELECT 
    id,
    phone,
    email,
    verification_status,
    role_id
  FROM users 
  WHERE phone = '6360306853'
  LIMIT 1
)

-- Step 2: Get full vendor status
SELECT 
  u.id as user_id,
  u.phone,
  u.email,
  u.verification_status as users_verification_status,
  r.name as role_name,
  v.id as vendor_id,
  v.business_name,
  vvs.overall_status,
  vvs.all_documents_submitted,
  vvs.submitted_at,
  vvs.approved_at,
  vvs.rejected_at,
  vvs.verified_by,
  CASE 
    WHEN vvs.overall_status = 'approved' THEN 'SHOULD_SEE_DASHBOARD'
    WHEN vvs.overall_status IN ('pending', 'not_started') THEN 'SHOULD_SEE_WAITING_SCREEN'
    WHEN vvs.overall_status = 'rejected' THEN 'SHOULD_SEE_REJECTION'
    ELSE 'UNKNOWN_STATUS'
  END as expected_behavior,
  (SELECT COUNT(*) FROM vendor_documents WHERE user_id = u.id) as document_records_count,
  (SELECT COUNT(jsonb_object_keys(documents)) FROM vendor_documents WHERE user_id = u.id) as document_types_uploaded
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.phone = '6360306853';

-- Step 3: Check documents detail
SELECT 
  'DOCUMENTS_DETAIL' as check_type,
  (SELECT jsonb_object_keys(documents) FROM vendor_documents WHERE user_id IN (SELECT id FROM users WHERE phone = '6360306853') LIMIT 1)::text as document_types,
  (SELECT created_at FROM vendor_documents WHERE user_id IN (SELECT id FROM users WHERE phone = '6360306853') LIMIT 1)::text as docs_created_at,
  (SELECT updated_at FROM vendor_documents WHERE user_id IN (SELECT id FROM users WHERE phone = '6360306853') LIMIT 1)::text as docs_updated_at;

-- Step 4: Check if RLS is blocking
SELECT 
  'RLS_DIAGNOSIS' as check_type,
  COUNT(*) as total_approved_vendors,
  COUNT(CASE WHEN overall_status = 'approved' THEN 1 END) as count_approved_status,
  COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as count_approved_at_set
FROM vendor_verification_status;
