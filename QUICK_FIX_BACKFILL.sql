-- ============================================================
-- QUICK FIX: Backfill all 9 documents for driver "Smiling"
-- ============================================================
-- Step 1: First run this ONCE:
-- ALTER TABLE driver_documents ALTER COLUMN document_data DROP NOT NULL;
--
-- Step 2: Then run this backfill query
-- Run this SQL in Supabase Dashboard → SQL Editor
-- This creates database records for documents already in bucket

-- IMPORTANT: 
-- Replace 'a3c7433b-e2d9-4963-b378-30d3996e23af' with the actual driver ID
-- Only include document types that are ACTUALLY in the bucket

BEGIN;

-- Insert all 9 document records
INSERT INTO driver_documents (driver_id, document_type, status, uploaded_at, created_at, updated_at) 
VALUES 
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'DL', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'VEHICLE_FRONT', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'INSURANCE', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'FC', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'EMISSION', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'RC', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'AADHAR', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'BANK_PASSBOOK_FRONT', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'DRIVER_SELFIE', 'pending', NOW(), NOW(), NOW())
ON CONFLICT (driver_id, document_type) DO NOTHING;

-- Create verification status record
INSERT INTO driver_verification_status (driver_id, overall_status, all_documents_submitted, submitted_at, created_at, updated_at) 
VALUES ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'pending_review', true, NOW(), NOW(), NOW())
ON CONFLICT (driver_id) DO UPDATE SET overall_status = 'pending_review', all_documents_submitted = true, submitted_at = NOW();

-- Verify
SELECT 'Documents created:' as status, COUNT(*) as count FROM driver_documents 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'
UNION ALL
SELECT 'Verification status created:', CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM driver_verification_status 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

COMMIT;
