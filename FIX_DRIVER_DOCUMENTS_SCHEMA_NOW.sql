-- ============================================================
-- IMMEDIATE FIX: Make document_data nullable
-- ============================================================
-- Run this NOW in Supabase SQL Editor to allow backfill
-- Then run the backfill query

ALTER TABLE driver_documents 
  ALTER COLUMN document_data DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'driver_documents' AND column_name = 'document_data';
