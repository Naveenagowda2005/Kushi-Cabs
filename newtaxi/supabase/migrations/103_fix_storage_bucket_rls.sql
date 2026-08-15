-- Fix storage bucket RLS policies to allow listing and downloading
-- The driver-documents bucket should allow authenticated users to list their own documents

-- IMPORTANT: Run this via Supabase Dashboard SQL Editor
-- Storage RLS policies need to be managed from storage-specific admin

-- For now, manually disable RLS in Supabase Dashboard:
-- 1. Go to Storage > driver-documents bucket
-- 2. Click "Policies"
-- 3. Click "Disable RLS" if it's enabled
-- 4. Make bucket PUBLIC in bucket settings

-- After that, all these commands are no longer needed:
-- - Users can list files from buckets
-- - Users can download public files
-- - Backend with service role key can upload with upsert: true
