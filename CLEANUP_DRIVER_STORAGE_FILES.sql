-- Cleanup orphaned storage files for a specific driver that was already deleted
-- Replace USER_ID_HERE with the actual driver's user ID (the UUID from drivers table)

-- Example: The driver folder that has orphaned files
-- drivers/35af8576-fafb-4a79-9f7d-9208214d6fca/

-- Since Supabase Storage management requires backend API calls, here's the manual process:
-- 1. Go to Supabase dashboard
-- 2. Click on "Storage" in the left sidebar
-- 3. Open "driver-documents" bucket
-- 4. Navigate to drivers/USER_ID_HERE/ folder
-- 5. Select all files in that folder
-- 6. Click "Delete" button

-- Or use this endpoint from backend to delete manually:
-- POST http://localhost:4000/admin/delete-user
-- Body: { "userId": "35af8576-fafb-4a79-9f7d-9208214d6fca" }

-- This will now properly delete all files in the drivers/USER_ID_HERE/ folder
-- The improved backend code now:
-- 1. Lists all files in drivers/{userId}/ folder
-- 2. Filters to only actual files (not directories)
-- 3. Deletes them in batches of 100 files
-- 4. Logs detailed progress for verification

-- Check if specific driver's documents still exist:
SELECT 
  file_name,
  document_type,
  storage_path,
  uploaded_at,
  status
FROM driver_documents
WHERE driver_id = 'USER_ID_HERE'  -- Replace with actual driver UUID
ORDER BY uploaded_at DESC;

-- If the driver was already deleted from auth/users but files remain in storage,
-- use the backend delete-user endpoint with the driver's user_id to clean up storage files
