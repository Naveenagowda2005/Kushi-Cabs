-- ============================================================
-- Migration: 063_vendor_re_verification.sql
-- PURPOSE: Allow vendors to re-upload documents without losing
--          dashboard access. Adds is_re_verification flag so
--          the trigger does NOT downgrade users.verification_status
--          back to 'pending' for already-approved vendors.
-- ============================================================

-- 1. Add is_re_verification column to vendor_verification_status
ALTER TABLE vendor_verification_status
  ADD COLUMN IF NOT EXISTS is_re_verification BOOLEAN DEFAULT FALSE;

-- 2. Update the trigger — skip status downgrade when re-verifying
CREATE OR REPLACE FUNCTION sync_vendor_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When it's a re-verification (vendor re-uploaded after being approved),
  -- do NOT touch users.verification_status — vendor keeps dashboard access.
  -- Only sync when it's a real status change (first time or admin decision).
  IF NEW.is_re_verification = TRUE AND NEW.overall_status = 'pending' THEN
    RETURN NEW; -- skip the users table update entirely
  END IF;

  UPDATE users
  SET verification_status = CASE
    WHEN NEW.overall_status = 'approved' THEN 'approved'
    WHEN NEW.overall_status = 'rejected' THEN 'rejected'
    WHEN NEW.all_documents_submitted    THEN 'pending'
    ELSE 'not_started'
  END
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update reset_vendor_to_pending RPC to set is_re_verification = TRUE
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
    overall_status          = 'pending',
    all_documents_submitted = TRUE,
    submitted_at            = NOW(),
    approved_at             = NULL,
    rejected_at             = NULL,
    rejection_reason        = NULL,
    verified_by             = NULL,
    verified_at             = NULL,
    is_re_verification      = TRUE,   -- ← KEY: prevents trigger from downgrading user
    updated_at              = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- 4. When admin approves/rejects, clear is_re_verification flag
--    Update update_vendor_verification RPC to always clear the flag
CREATE OR REPLACE FUNCTION update_vendor_verification(
  p_vendor_id UUID,
  p_overall_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendor_verification_status
  SET
    overall_status      = p_overall_status,
    approved_at         = CASE WHEN p_overall_status = 'approved' THEN NOW() ELSE approved_at END,
    rejected_at         = CASE WHEN p_overall_status = 'rejected' THEN NOW() ELSE rejected_at END,
    rejection_reason    = COALESCE(p_rejection_reason, rejection_reason),
    verified_at         = NOW(),
    is_re_verification  = FALSE,  -- ← clear flag on admin decision
    updated_at          = NOW()
  WHERE vendor_id = p_vendor_id;
END;
$$;

COMMENT ON COLUMN vendor_verification_status.is_re_verification IS
  'TRUE when vendor re-uploaded docs after being approved. Prevents trigger from revoking dashboard access.';
COMMENT ON FUNCTION reset_vendor_to_pending IS
  'Reset to pending for re-verification — sets is_re_verification=TRUE so vendor keeps dashboard access.';
COMMENT ON FUNCTION update_vendor_verification IS
  'Admin approve/reject — clears is_re_verification flag.';
