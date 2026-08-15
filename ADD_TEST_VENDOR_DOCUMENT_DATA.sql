-- Add sample base64 document data to a vendor for testing the viewer
-- This is for testing purposes only

UPDATE vendor_documents
SET documents = jsonb_set(
  documents,
  '{AADHAR}',
  jsonb_build_object(
    'status', 'pending',
    'document_data', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'uploaded_at', NOW()::text,
    'rejection_reason', NULL
  )
)
WHERE user_id = '16a0a599-405b-4dc6-838c-3e4ddf7de384';

-- Verify
SELECT 
  user_id,
  documents -> 'AADHAR' ->> 'status' as status,
  length(documents -> 'AADHAR' ->> 'document_data') as data_length,
  documents -> 'AADHAR' ->> 'uploaded_at' as uploaded_at
FROM vendor_documents
WHERE user_id = '16a0a599-405b-4dc6-838c-3e4ddf7de384';
