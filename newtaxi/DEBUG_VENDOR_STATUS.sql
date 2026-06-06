-- ============================================================
-- DEBUG SCRIPT: Check Vendor Verification Status
-- ============================================================

-- Get all vendors and their verification status
SELECT 
  u.id as user_id,
  u.full_name,
  u.phone,
  u.verification_status as user_verification_status,
  v.company_name,
  vvs.overall_status,
  vvs.all_documents_submitted,
  vvs.submitted_at,
  vvs.approved_at,
  vvs.rejected_at,
  vvs.created_at,
  vvs.updated_at
FROM users u
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.role = 'vendor'
ORDER BY vvs.created_at DESC NULLS LAST;

-- Check vendor documents
SELECT 
  vd.user_id,
  u.full_name,
  u.phone,
  vd.documents,
  vd.created_at,
  vd.updated_at
FROM vendor_documents vd
JOIN users u ON vd.user_id = u.id
ORDER BY vd.updated_at DESC;

-- Check for any pending vendors
SELECT 
  u.id,
  u.full_name,
  u.phone,
  vvs.overall_status,
  (SELECT COUNT(*) FROM vendor_documents vd WHERE vd.user_id = u.id) as has_documents
FROM vendor_verification_status vvs
JOIN users u ON vvs.user_id = u.id
WHERE vvs.overall_status = 'pending'
ORDER BY vvs.submitted_at DESC;

-- ============================================================
-- TO MANUALLY FIX: Set vendor to approved
-- ============================================================
-- UPDATE vendor_verification_status
-- SET overall_status = 'approved', 
--     approved_at = NOW(),
--     verified_at = NOW()
-- WHERE user_id = '{USER_ID}';
