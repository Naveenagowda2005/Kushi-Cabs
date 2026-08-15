-- ============================================================
-- Migration: 065_fix_is_re_verification_flag.sql
-- PURPOSE: Fix vendors whose is_re_verification flag is wrong.
--          Any vendor with overall_status = 'pending' but who
--          has a previous approved_at timestamp in history,
--          OR who has any document with status 'approved'
--          (meaning they were fully approved before),
--          should have is_re_verification = TRUE.
-- ============================================================

-- 1. Check current state before fixing
SELECT 
  vvs.user_id,
  vvs.overall_status,
  vvs.is_re_verification,
  vvs.approved_at,
  u.verification_status as user_verification_status
FROM vendor_verification_status vvs
JOIN users u ON u.id = vvs.user_id
WHERE vvs.overall_status = 'pending';

-- 2. Fix: mark as re-verification if vendor has ANY approved document
--    (means they were previously fully approved)
UPDATE vendor_verification_status vvs
SET is_re_verification = TRUE
WHERE vvs.overall_status = 'pending'
  AND vvs.is_re_verification IS DISTINCT FROM TRUE
  AND EXISTS (
    SELECT 1
    FROM vendor_documents vd
    WHERE vd.user_id = vvs.user_id
      AND vd.documents IS NOT NULL
      AND (
        vd.documents->'AADHAR'->>'status' = 'approved'
        OR vd.documents->'PAN_CARD'->>'status' = 'approved'
        OR vd.documents->'BANK_PASSBOOK_FRONT'->>'status' = 'approved'
        OR vd.documents->'VENDOR_SELFIE'->>'status' = 'approved'
      )
  );

-- 3. Verify after fix
SELECT 
  vvs.user_id,
  vvs.overall_status,
  vvs.is_re_verification,
  u.verification_status as user_verification_status
FROM vendor_verification_status vvs
JOIN users u ON u.id = vvs.user_id
WHERE vvs.overall_status = 'pending';
