-- Check trips assigned to driver 9686314982 (NAVEENA N G)
-- user_id: 17329dcb-56e0-4f14-9ef9-1d926f71381f

SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  pickup_location,
  dropoff_location,
  created_at
FROM trips
WHERE accepted_by = '17329dcb-56e0-4f14-9ef9-1d926f71381f'
  AND status IN ('accepted', 'in_progress')
LIMIT 10;

-- ============================================================
-- Also check if driver_id matches
-- ============================================================
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  pickup_location,
  dropoff_location,
  created_at
FROM trips
WHERE driver_id = '18d69f11-2ccc-457b-9ea4-aade9cf878dd'
  AND status IN ('accepted', 'in_progress')
LIMIT 10;
