-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- NOT from the app — these bypass RLS using the dashboard's service role
-- ============================================================

-- STEP 1: See what the 19 missing trips have
SELECT 
  t.id,
  t.booking_id_seq,
  t.driver_id,
  t.accepted_by,
  t.vendor_id,
  t.completed_at,
  d.user_id       AS driver_user_id,
  u.full_name     AS driver_name,
  u.phone         AS driver_phone
FROM trips t
LEFT JOIN drivers d ON d.id = t.driver_id
LEFT JOIN users   u ON u.id = d.user_id
WHERE t.status = 'completed'
  AND t.accepted_by IS NULL;

-- ============================================================
-- STEP 2: Backfill accepted_by from driver_id → drivers.user_id
-- Run only AFTER reviewing Step 1 results
-- ============================================================
UPDATE trips
SET accepted_by = (
  SELECT user_id FROM drivers WHERE id = trips.driver_id
)
WHERE status = 'completed'
  AND accepted_by IS NULL
  AND driver_id IS NOT NULL;

-- STEP 3: Final check
SELECT
  COUNT(*)                        AS total_completed,
  COUNT(accepted_by)              AS with_accepted_by,
  COUNT(*) - COUNT(accepted_by)   AS still_missing
FROM trips
WHERE status = 'completed';
