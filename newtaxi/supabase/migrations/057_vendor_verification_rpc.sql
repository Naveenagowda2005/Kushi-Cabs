-- ============================================================
-- RPC: Get vendor verifications for super admin
-- Migration: 057_vendor_verification_rpc.sql
-- ============================================================
-- WHY: Super admin uses a mock session (not a real Supabase JWT),
-- so auth.uid() returns NULL and all RLS policies block reads.
-- This SECURITY DEFINER function bypasses RLS entirely.
-- ============================================================

CREATE OR REPLACE FUNCTION get_vendor_verifications(p_status TEXT)
RETURNS TABLE (
  id UUID,
  vendor_id UUID,
  user_id UUID,
  overall_status TEXT,
  all_documents_submitted BOOLEAN,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    vvs.updated_at
  FROM vendor_verification_status vvs
  WHERE vvs.overall_status = p_status
  ORDER BY vvs.submitted_at DESC;
END;
$$;

-- ============================================================
-- RPC: Get user info by ID (bypasses RLS for super admin)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_by_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  verification_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.phone,
    u.email,
    u.verification_status
  FROM users u
  WHERE u.id = p_user_id;
END;
$$;

-- ============================================================
-- RPC: Get vendor info by ID (bypasses RLS for super admin)
-- ============================================================
CREATE OR REPLACE FUNCTION get_vendor_by_id(p_vendor_id UUID)
RETURNS TABLE (
  id UUID,
  company_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.company_name
  FROM vendors v
  WHERE v.id = p_vendor_id;
END;
$$;

-- ============================================================
-- RPC: Get vendor documents by user ID (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION get_vendor_documents_by_user(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  vendor_id UUID,
  documents JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vd.user_id,
    vd.vendor_id,
    vd.documents
  FROM vendor_documents vd
  WHERE vd.user_id = p_user_id;
END;
$$;

-- ============================================================
-- RPC: Update vendor verification status (bypasses RLS)
-- ============================================================
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
    overall_status = p_overall_status,
    approved_at = CASE WHEN p_overall_status = 'approved' THEN NOW() ELSE approved_at END,
    rejected_at = CASE WHEN p_overall_status = 'rejected' THEN NOW() ELSE rejected_at END,
    rejection_reason = COALESCE(p_rejection_reason, rejection_reason),
    verified_at = NOW(),
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id;
END;
$$;

-- ============================================================
-- RPC: Update vendor document status (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION update_vendor_document_status(
  p_user_id UUID,
  p_documents JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendor_documents
  SET 
    documents = p_documents,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================================
-- RPC: Update user verification status (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_verification_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET verification_status = p_status
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION get_vendor_verifications IS 'Fetch vendor verification records by status - bypasses RLS for super admin mock session';
COMMENT ON FUNCTION update_vendor_verification IS 'Update vendor verification status - bypasses RLS for super admin mock session';
COMMENT ON FUNCTION update_vendor_document_status IS 'Update vendor document statuses - bypasses RLS for super admin mock session';

-- ============================================================
-- RPC: Get pending driver verification count (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION get_driver_verifications_pending_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM driver_verification_status
  WHERE overall_status = 'pending_review';
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_driver_verifications_pending_count IS 'Get count of pending driver verifications - bypasses RLS for super admin mock session';
