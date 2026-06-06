-- RUN EACH BLOCK SEPARATELY IN SUPABASE SQL EDITOR
-- Copy one block at a time, run it, share the result

-- ============================================================
-- QUERY 1: Check vendor_verification_status table
-- ============================================================
SELECT 
  vvs.id,
  vvs.overall_status,
  vvs.all_documents_submitted,
  vvs.submitted_at,
  vvs.created_at,
  u.full_name,
  u.phone,
  u.verification_status
FROM vendor_verification_status vvs
JOIN users u ON u.id = vvs.user_id
ORDER BY vvs.created_at DESC;

-- ============================================================
-- QUERY 2: Check vendor_documents table (what was uploaded)
-- ============================================================
SELECT 
  vd.user_id,
  vd.vendor_id,
  jsonb_object_keys(vd.documents) AS uploaded_doc_type,
  vd.updated_at
FROM vendor_documents vd
ORDER BY vd.updated_at DESC;

-- ============================================================
-- QUERY 3: Check vendors table
-- ============================================================
SELECT 
  v.id AS vendor_id,
  v.user_id,
  v.company_name,
  u.full_name,
  u.phone,
  u.verification_status
FROM vendors v
JOIN users u ON u.id = v.user_id
ORDER BY v.created_at DESC;

-- ============================================================
-- QUERY 4: Check RLS on vendor_verification_status
-- ============================================================
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'vendor_verification_status'
ORDER BY policyname;
