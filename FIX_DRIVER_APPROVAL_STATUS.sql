-- ============================================================
-- IMMEDIATE FIX: Set driver overall_status to 'approved'
-- ============================================================

UPDATE driver_verification_status
SET 
  overall_status = 'approved'::verification_status,
  approved_at = COALESCE(approved_at, NOW())
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- Verify the fix
SELECT 
  driver_id,
  overall_status,
  approved_at,
  is_re_verification,
  updated_at
FROM driver_verification_status
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';
