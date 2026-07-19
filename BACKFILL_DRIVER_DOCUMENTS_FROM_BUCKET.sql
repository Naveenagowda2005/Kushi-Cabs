-- ============================================================
-- BACKFILL DRIVER DOCUMENTS TABLE FROM BUCKET
-- ============================================================
-- Purpose: Create database records for documents already uploaded to bucket
-- This bridges the gap where files are in bucket but no DB records exist
-- ============================================================

-- Step 1: Get list of drivers and document types in bucket
-- Run this first to see what's in the bucket:
SELECT 
  COUNT(*) as total_documents,
  COUNT(DISTINCT driver_id) as unique_drivers
FROM driver_documents;

-- Step 2: Create a record for EACH document that's in the bucket
-- For driver "Smiling" with ID: a3c7433b-e2d9-4963-b378-30d3996e23af
-- Replace this with actual document types found in bucket

-- First, check if records already exist
SELECT * FROM driver_documents 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'
ORDER BY document_type;

-- If no records, insert them:
-- The document types must match what's in the bucket (DL.jpg, VEHICLE_FRONT.jpg, etc.)

INSERT INTO driver_documents (
  driver_id,
  document_type,
  status,
  uploaded_at,
  created_at,
  updated_at
) VALUES
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

-- Step 3: Create verification status record
INSERT INTO driver_verification_status (
  driver_id,
  overall_status,
  all_documents_submitted,
  submitted_at,
  created_at,
  updated_at
) VALUES (
  'a3c7433b-e2d9-4963-b378-30d3996e23af',
  'pending_review',
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (driver_id) DO UPDATE SET
  overall_status = 'pending_review',
  all_documents_submitted = true,
  submitted_at = NOW(),
  updated_at = NOW();

-- Step 4: Verify the records were created
SELECT 
  driver_id,
  document_type,
  status,
  uploaded_at
FROM driver_documents 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'
ORDER BY document_type;

SELECT 
  driver_id,
  overall_status,
  all_documents_submitted,
  submitted_at
FROM driver_verification_status 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- ============================================================
-- TO BACKFILL FOR ALL DRIVERS:
-- ============================================================
-- If you need to backfill for multiple drivers, do it driver by driver
-- Get the driver IDs from your users table:

SELECT id, phone, full_name FROM users 
WHERE role_id = (SELECT id FROM roles WHERE name = 'driver')
LIMIT 20;

-- Then for each driver that has documents in bucket, run the insert above
-- with their driver_id

-- ============================================================
-- IMPORTANT NOTES:
-- ============================================================
-- 1. Only insert records for documents that ACTUALLY exist in the bucket
-- 2. If you insert a record but no file exists, it will show as "pending" 
--    but no file to verify
-- 3. After running this, restart the super admin app
-- 4. The driver should now appear in "Driver Verification" tab
-- 5. Super admin can now approve/reject each document
