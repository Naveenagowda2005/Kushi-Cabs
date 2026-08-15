-- Cleanup Orphaned Storage Files
-- This script identifies drivers that were deleted from the database but still have files in storage

-- Step 1: Find all deleted driver UUIDs from the storage folder
-- You can manually check which folders in storage don't have corresponding users
-- From the screenshot, we see: 35af8576-fafb-4a79-9f7d-9208214d6fca

-- Step 2: Verify this driver doesn't exist in the database
SELECT * FROM users WHERE id = '35af8576-fafb-4a79-9f7d-9208214d6fca';

-- Step 3: Verify this driver doesn't exist in drivers table
SELECT * FROM drivers WHERE user_id = '35af8576-fafb-4a79-9f7d-9208214d6fca';

-- These files should be manually deleted from the Supabase Storage bucket:
-- Path: driver-documents/drivers/35af8576-fafb-4a79-9f7d-9208214d6fca/
-- Files:
-- - AADHAR.jpg
-- - BANK_PASSBOOK_FRONT.jpg
-- - DL.jpg
-- - DRIVER_SELFIE.jpeg
-- - EMISSION.jpg
-- - FC.jpg
-- - INSURANCE.jpg
-- - RC.jpg
-- - VEHICLE_FRONT.jpg
