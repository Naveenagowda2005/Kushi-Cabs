-- ============================================================
-- Migration 110: NO RLS POLICIES NEEDED
-- The odometer-images bucket is PRIVATE (public=false)
-- This automatically handles access control - no policies needed
-- 
-- Same approach as:
-- - driver-documents (PRIVATE bucket, works without policies)
-- - vendor-documents (PRIVATE bucket, works without policies)
-- ============================================================

-- No RLS policies to create
-- The bucket is private by default
-- Upload works immediately

SELECT 'Migration 110 — No RLS policies needed (bucket is private)' AS status;
