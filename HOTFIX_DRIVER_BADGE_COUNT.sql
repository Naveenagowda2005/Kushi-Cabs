-- HOTFIX: Driver verification badge count was always 0
-- Root cause: RPC was counting overall_status = 'pending'
--             but drivers are submitted with overall_status = 'pending_review'
-- Fix: Update RPC to count 'pending_review' status

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

COMMENT ON FUNCTION get_driver_verifications_pending_count IS 'Get count of pending_review driver verifications - bypasses RLS for super admin mock session';
