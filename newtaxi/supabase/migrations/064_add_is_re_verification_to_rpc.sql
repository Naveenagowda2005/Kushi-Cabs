-- ============================================================
-- Migration: 064_add_is_re_verification_to_rpc.sql
-- PURPOSE: Update get_vendor_verifications RPC to include
--          is_re_verification so admin dashboard can show
--          "NEW" vs "RE-UPLOAD" badge on vendor cards.
-- ============================================================

DROP FUNCTION IF EXISTS get_vendor_verifications(TEXT);

CREATE FUNCTION get_vendor_verifications(p_status TEXT)
RETURNS TABLE (
  id                    UUID,
  vendor_id             UUID,
  user_id               UUID,
  overall_status        TEXT,
  all_documents_submitted BOOLEAN,
  submitted_at          TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  verified_by           UUID,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ,
  is_re_verification    BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vvs.id,
    vvs.vendor_id,
    vvs.user_id,
    vvs.overall_status,
    vvs.all_documents_submitted,
    vvs.submitted_at,
    vvs.approved_at,
    vvs.rejected_at,
    vvs.rejection_reason,
    vvs.verified_by,
    vvs.verified_at,
    vvs.created_at,
    vvs.updated_at,
    COALESCE(vvs.is_re_verification, FALSE) AS is_re_verification
  FROM vendor_verification_status vvs
  WHERE vvs.overall_status = p_status
  ORDER BY vvs.submitted_at DESC;
END;
$$;

COMMENT ON FUNCTION get_vendor_verifications IS
  'Fetch vendor verifications by status — includes is_re_verification flag for admin badge display';
