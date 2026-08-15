-- ============================================================
-- TEST: Approved driver re-uploads document - status should NOT change
-- ============================================================

-- Current state of the driver (should be 'approved')
SELECT 
  driver_id,
  overall_status,
  is_re_verification,
  approved_at
FROM driver_verification_status
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- Simulate a re-upload: Insert a pending document for an approved driver
INSERT INTO driver_documents (
  driver_id,
  document_type,
  status,
  uploaded_at
) VALUES (
  'a3c7433b-e2d9-4963-b378-30d3996e23af',
  'TEST_DOC_REUPLOAD',
  'pending',
  NOW()
);

-- Check status after re-upload - should STILL be 'approved' (not reverted to 'pending')
SELECT 
  driver_id,
  overall_status,
  is_re_verification,
  approved_at,
  updated_at
FROM driver_verification_status
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- If overall_status is still 'approved', the protection is working! ✅
-- Clean up the test document
DELETE FROM driver_documents 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af' 
  AND document_type = 'TEST_DOC_REUPLOAD';
