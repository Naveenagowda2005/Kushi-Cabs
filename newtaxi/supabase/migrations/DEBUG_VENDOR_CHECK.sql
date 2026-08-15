-- ============================================================
-- RUN THESE ONE BY ONE IN SUPABASE SQL EDITOR
-- ============================================================

-- STEP 1: Check if vendor submitted anything at all
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

-- STEP 2: Check vendor_documents table
SELECT 
  vd.user_id,
  vd.vendor_id,
  jsonb_object_keys(vd.documents) as uploaded_doc_type,
  vd.created_at,
  vd.updated_at
FROM vendor_documents vd
ORDER BY vd.created_at DESC;

-- ============================================================

-- STEP 3: Check vendors table
SELECT 
  v.id as vendor_id,
  v.user_id,
  v.company_name,
  u.full_name,
  u.phone,
  u.verification_status
FROM vendors v
JOIN users u ON u.id = v.user_id
ORDER BY v.created_at DESC;

-- ============================================================

-- STEP 4: Check RLS policies on vendor_verification_status
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendor_verification_status'
ORDER BY policyname;

-- ============================================================

-- STEP 5: Check RLS policies on vendor_documents  
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'vendor_documents'
ORDER BY policyname;
