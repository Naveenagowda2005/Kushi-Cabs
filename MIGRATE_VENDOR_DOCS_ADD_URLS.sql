-- Migrate vendor documents: Add document_url to documents that only have storage_path
-- This ensures all vendor documents have URLs for the verification dashboard

UPDATE vendor_documents
SET documents = jsonb_set(
  documents,
  -- For each document type, set the document_url
  CASE 
    WHEN documents -> 'AADHAR' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'AADHAR' ->> 'document_url' IS NULL
    THEN '{AADHAR, document_url}'
    
    WHEN documents -> 'PAN_CARD' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'PAN_CARD' ->> 'document_url' IS NULL
    THEN '{PAN_CARD, document_url}'
    
    WHEN documents -> 'BANK_PASSBOOK_FRONT' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'BANK_PASSBOOK_FRONT' ->> 'document_url' IS NULL
    THEN '{BANK_PASSBOOK_FRONT, document_url}'
    
    WHEN documents -> 'VENDOR_SELFIE' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'VENDOR_SELFIE' ->> 'document_url' IS NULL
    THEN '{VENDOR_SELFIE, document_url}'
  END,
  -- Construct public URL from storage_path
  CASE 
    WHEN documents -> 'AADHAR' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'AADHAR' ->> 'document_url' IS NULL
    THEN to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'AADHAR' ->> 'storage_path'))
    
    WHEN documents -> 'PAN_CARD' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'PAN_CARD' ->> 'document_url' IS NULL
    THEN to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'PAN_CARD' ->> 'storage_path'))
    
    WHEN documents -> 'BANK_PASSBOOK_FRONT' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'BANK_PASSBOOK_FRONT' ->> 'document_url' IS NULL
    THEN to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'BANK_PASSBOOK_FRONT' ->> 'storage_path'))
    
    WHEN documents -> 'VENDOR_SELFIE' ->> 'storage_path' IS NOT NULL 
      AND documents -> 'VENDOR_SELFIE' ->> 'document_url' IS NULL
    THEN to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'VENDOR_SELFIE' ->> 'storage_path'))
  END
)
WHERE EXISTS (
  SELECT 1 FROM (
    SELECT 
      documents -> 'AADHAR' ->> 'storage_path' as aadhar_path,
      documents -> 'PAN_CARD' ->> 'storage_path' as pan_path,
      documents -> 'BANK_PASSBOOK_FRONT' ->> 'storage_path' as bank_path,
      documents -> 'VENDOR_SELFIE' ->> 'storage_path' as selfie_path,
      documents -> 'AADHAR' ->> 'document_url' as aadhar_url,
      documents -> 'PAN_CARD' ->> 'document_url' as pan_url,
      documents -> 'BANK_PASSBOOK_FRONT' ->> 'document_url' as bank_url,
      documents -> 'VENDOR_SELFIE' ->> 'document_url' as selfie_url
    WHERE (
      (documents -> 'AADHAR' ->> 'storage_path' IS NOT NULL AND documents -> 'AADHAR' ->> 'document_url' IS NULL)
      OR (documents -> 'PAN_CARD' ->> 'storage_path' IS NOT NULL AND documents -> 'PAN_CARD' ->> 'document_url' IS NULL)
      OR (documents -> 'BANK_PASSBOOK_FRONT' ->> 'storage_path' IS NOT NULL AND documents -> 'BANK_PASSBOOK_FRONT' ->> 'document_url' IS NULL)
      OR (documents -> 'VENDOR_SELFIE' ->> 'storage_path' IS NOT NULL AND documents -> 'VENDOR_SELFIE' ->> 'document_url' IS NULL)
    )
  ) sub
);

-- Simpler approach: just set document_url = storage_path with the base URL prepended
-- Do this for each document type individually to be safe

UPDATE vendor_documents
SET documents = documents || jsonb_build_object(
  'AADHAR',
  jsonb_set(
    documents -> 'AADHAR',
    '{document_url}',
    to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'AADHAR' ->> 'storage_path'))
  )
)
WHERE documents -> 'AADHAR' ->> 'storage_path' IS NOT NULL
AND documents -> 'AADHAR' ->> 'document_url' IS NULL;

UPDATE vendor_documents
SET documents = documents || jsonb_build_object(
  'PAN_CARD',
  jsonb_set(
    documents -> 'PAN_CARD',
    '{document_url}',
    to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'PAN_CARD' ->> 'storage_path'))
  )
)
WHERE documents -> 'PAN_CARD' ->> 'storage_path' IS NOT NULL
AND documents -> 'PAN_CARD' ->> 'document_url' IS NULL;

UPDATE vendor_documents
SET documents = documents || jsonb_build_object(
  'BANK_PASSBOOK_FRONT',
  jsonb_set(
    documents -> 'BANK_PASSBOOK_FRONT',
    '{document_url}',
    to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'BANK_PASSBOOK_FRONT' ->> 'storage_path'))
  )
)
WHERE documents -> 'BANK_PASSBOOK_FRONT' ->> 'storage_path' IS NOT NULL
AND documents -> 'BANK_PASSBOOK_FRONT' ->> 'document_url' IS NULL;

UPDATE vendor_documents
SET documents = documents || jsonb_build_object(
  'VENDOR_SELFIE',
  jsonb_set(
    documents -> 'VENDOR_SELFIE',
    '{document_url}',
    to_jsonb('https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/' || (documents -> 'VENDOR_SELFIE' ->> 'storage_path'))
  )
)
WHERE documents -> 'VENDOR_SELFIE' ->> 'storage_path' IS NOT NULL
AND documents -> 'VENDOR_SELFIE' ->> 'document_url' IS NULL;

-- Verify the update
SELECT 
  user_id,
  documents -> 'AADHAR' ->> 'document_url' as aadhar_url,
  documents -> 'PAN_CARD' ->> 'document_url' as pan_url,
  documents -> 'BANK_PASSBOOK_FRONT' ->> 'document_url' as bank_url,
  documents -> 'VENDOR_SELFIE' ->> 'document_url' as selfie_url
FROM vendor_documents
LIMIT 5;
