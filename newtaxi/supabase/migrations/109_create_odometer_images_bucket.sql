-- ============================================================
-- Migration 109: Create odometer-images storage bucket
-- Same approach as driver-documents: PRIVATE bucket, NO RLS policies
-- Drivers upload odometer images here (public=false means RLS disabled by default)
-- ============================================================

-- Create the bucket as PRIVATE (like driver-documents)
-- Public=false means RLS is disabled - anyone can upload/download
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'odometer-images',
  'odometer-images',
  false,  -- PRIVATE bucket (matches driver-documents, vendor-documents)
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,  -- PRIVATE bucket
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- NO RLS POLICIES NEEDED
-- Bucket is private by default - RLS policies are not required
-- This matches the approach used for driver-documents and vendor-documents
-- Upload works without any policies

SELECT 'Migration 109 applied — odometer-images bucket created (PRIVATE, no RLS policies needed)' AS status;
