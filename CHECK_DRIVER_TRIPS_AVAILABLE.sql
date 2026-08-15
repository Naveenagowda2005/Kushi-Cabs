-- ============================================================
-- CHECK: What trips are available for the driver
-- ============================================================

-- 1. Check all pending trips
SELECT 
  id, 
  status, 
  is_admin_trip, 
  admin_assigned_drivers,
  created_at
FROM trips
WHERE status = 'pending'
LIMIT 10;

-- 2. Check admin trips assigned to this driver
SELECT 
  id, 
  status, 
  is_admin_trip, 
  admin_assigned_drivers,
  created_at
FROM trips
WHERE is_admin_trip = true 
  AND admin_assigned_drivers IS NOT NULL
  AND admin_assigned_drivers @> ARRAY['a3c7433b-e2d9-4963-b378-30d3996e23af'::uuid]
LIMIT 10;

-- 3. Check vendor-assigned trips to this driver
SELECT 
  id, 
  status, 
  driver_id,
  created_at
FROM trips
WHERE driver_id = (SELECT id FROM drivers WHERE user_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af')
LIMIT 10;

-- 4. Count total trips
SELECT COUNT(*) as total_trips FROM trips;
SELECT COUNT(*) as pending_trips FROM trips WHERE status = 'pending';
SELECT COUNT(*) as admin_trips FROM trips WHERE is_admin_trip = true;
