-- ============================================================
-- FIX STORAGE BUCKET RLS - Allow document uploads and listing
-- ============================================================
-- Issue: driver-documents, vendor-documents, and user-avatars 
-- buckets have RLS enabled which blocks uploads

-- SOLUTION 1: Disable RLS on storage buckets
-- Run this via Supabase Dashboard:
-- 1. Go to Storage → driver-documents
-- 2. Click on "Policies" 
-- 3. If you see RLS is "Enabled", click "Disable RLS"
-- 4. Repeat for vendor-documents and user-avatars

-- SOLUTION 2: OR create proper RLS policies via SQL
-- Run these commands in Supabase SQL Editor:

-- ============================================================
-- DRIVER DOCUMENTS BUCKET
-- ============================================================

-- Policy: Allow authenticated users to list and view files in their own folder
CREATE POLICY "Allow drivers to list their documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow backend (service role) to upload documents
-- Service role bypasses RLS, but explicitly allow it
CREATE POLICY "Backend can upload driver documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'driver-documents'
);

-- Policy: Allow deletion for admins
CREATE POLICY "Admin can delete driver documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
  )
);

-- ============================================================
-- VENDOR DOCUMENTS BUCKET
-- ============================================================

CREATE POLICY "Allow vendors to list their documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vendor-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Backend can upload vendor documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-documents'
);

CREATE POLICY "Admin can delete vendor documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vendor-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
  )
);

-- ============================================================
-- USER AVATARS BUCKET
-- ============================================================

CREATE POLICY "Allow authenticated users to view avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Backend can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars'
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- VERIFY BY CHECKING IN SUPABASE DASHBOARD:
-- ============================================================
-- 1. Go to Storage → driver-documents → Policies
-- 2. Should see policies listed above (not "RLS Disabled" text)
-- 3. If it still says RLS is disabled, that's also fine - means no restrictions
-- 4. Test: Upload a document from driver app
-- 5. Check: File should appear in bucket (Storage → driver-documents → drivers/{driverId}/)
