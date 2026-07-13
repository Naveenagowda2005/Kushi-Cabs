-- ============================================================
-- RPC: Reset vendor verification back to pending
-- Migration: 062_reset_vendor_to_pending_rpc.sql
-- ============================================================
-- WHY: When a vendor re-uploads a document from their profile
-- after being approved, we need to reset the overall_status
-- back to 'pending' AND clear approved_at so the vendor
-- re-appears cleanly in the admin's Pending tab.
-- ============================================================

CREATE OR REPLACE FUNCTION reset_vendor_to_pending(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendor_verification_status
  SET
    overall_status      = 'pending',
    all_documents_submitted = true,
    submitted_at        = NOW(),
    approved_at         = NULL,
    rejected_at         = NULL,
    rejection_reason    = NULL,
    verified_by         = NULL,
    verified_at         = NULL,
    updated_at          = NOW()
  WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION reset_vendor_to_pending IS
  'Reset vendor verification to pending after re-uploading a document — bypasses RLS for vendor session';
