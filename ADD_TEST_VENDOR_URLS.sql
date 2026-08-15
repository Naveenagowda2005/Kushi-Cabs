-- Add test document URLs to vendor for testing the verification dashboard
-- Using placeholder Supabase URLs

UPDATE vendor_documents
SET documents = documents || jsonb_build_object(
  'AADHAR', documents->'AADHAR' || jsonb_build_object(
    'document_url', 'https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/16a0a599-405b-4dc6-838c-3e4ddf7de384/AADHAR_test.jpg'
  ),
  'PAN_CARD', documents->'PAN_CARD' || jsonb_build_object(
    'document_url', 'https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/16a0a599-405b-4dc6-838c-3e4ddf7de384/PAN_CARD_test.jpg'
  ),
  'BANK_PASSBOOK_FRONT', documents->'BANK_PASSBOOK_FRONT' || jsonb_build_object(
    'document_url', 'https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/16a0a599-405b-4dc6-838c-3e4ddf7de384/BANK_PASSBOOK_FRONT_test.jpg'
  ),
  'VENDOR_SELFIE', documents->'VENDOR_SELFIE' || jsonb_build_object(
    'document_url', 'https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/vendor-documents/16a0a599-405b-4dc6-838c-3e4ddf7de384/VENDOR_SELFIE_test.jpg'
  )
)
WHERE user_id = '16a0a599-405b-4dc6-838c-3e4ddf7de384';

-- Verify
SELECT 
  user_id,
  documents -> 'AADHAR' ->> 'document_url' as aadhar_url,
  documents -> 'PAN_CARD' ->> 'document_url' as pan_url,
  documents -> 'BANK_PASSBOOK_FRONT' ->> 'document_url' as bank_url,
  documents -> 'VENDOR_SELFIE' ->> 'document_url' as selfie_url
FROM vendor_documents
WHERE user_id = '16a0a599-405b-4dc6-838c-3e4ddf7de384';
