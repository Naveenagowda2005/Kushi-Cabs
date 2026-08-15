-- ============================================================
-- Investigate the 19 trips that still have no accepted_by
-- ============================================================

-- Step 1: See what data those 19 trips have
SELECT 
  t.id,
  t.booking_id_seq,
  t.status,
  t.driver_id,
  t.accepted_by,
  t.created_by,
  t.vendor_id,
  t.passenger_name,
  t.created_at,
  t.completed_at
FROM trips t
WHERE t.status = 'completed'
  AND t.accepted_by IS NULL
ORDER BY t.created_at DESC;

-- ============================================================
-- Step 2: Check if vendor_id can help us find the driver
-- (some old trips may only have vendor_id set)
-- ============================================================
SELECT 
  t.id,
  t.booking_id_seq,
  t.vendor_id,
  v.user_id as vendor_user_id,
  u.full_name as vendor_name,
  t.driver_id,
  t.accepted_by
FROM trips t
LEFT JOIN vendors v ON v.id = t.vendor_id
LEFT JOIN users u ON u.id = v.user_id
WHERE t.status = 'completed'
  AND t.accepted_by IS NULL
  AND t.vendor_id IS NOT NULL;

