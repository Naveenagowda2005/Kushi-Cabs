-- Check what's in vendor_documents table
SELECT 
  user_id,
  vendor_id,
  documents,
  jsonb_keys(documents) as doc_types,
  created_at,
  updated_at
FROM vendor_documents
WHERE user_id = '16a0a599-405b-4dc6-838c-3e4ddf7de384'
LIMIT 1;

-- Also check the structure of one document
SELECT 
  user_id,
  documents -> 'AADHAR' as aadhar_doc,
  documents -> 'AADHAR' ->> 'document_data' as aadhar_data_preview,
  documents -> 'AADHAR' ->> 'document_url' as aadhar_url,
  documents -> 'AADHAR' ->> 'status' as aadhar_status
FROM vendor_documents
WHERE user_id = '16a0a599-405b-4dc6-838c-3e4ddf7de384'
LIMIT 1;
