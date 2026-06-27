-- HOTFIX: RPC returning 0 even though 2+ records exist
-- The RPC function exists but isn't working. Force recreate it.

DROP FUNCTION IF EXISTS get_driver_verifications_pending_count();

CREATE OR REPLACE FUNCTION public.get_driver_verifications_pending_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM driver_verification_status
  WHERE overall_status = 'pending_review';
$$;

GRANT EXECUTE ON FUNCTION public.get_driver_verifications_pending_count TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_driver_verifications_pending_count IS 'Get count of pending_review driver verifications - bypasses RLS';

-- Test it
SELECT public.get_driver_verifications_pending_count() as pending_count;

-- Also verify the data exists
SELECT COUNT(*) FROM driver_verification_status WHERE overall_status = 'pending_review';
