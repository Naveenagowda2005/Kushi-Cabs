-- ============================================================
-- CREATE TEST TRIPS FOR DRIVER TO SEE TRIP COUNT TRACKING
-- ============================================================

-- First, get the driver ID
SELECT id FROM drivers WHERE user_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- Create 3 pending trips assigned to this driver via admin assignment
INSERT INTO trips (
  id,
  status,
  is_admin_trip,
  is_published,
  pickup_location,
  dropoff_location,
  fare_amount,
  commission_amount,
  commission_paid,
  scheduled_at,
  created_at,
  created_by,
  passenger_name,
  passenger_phone,
  admin_assigned_drivers
) VALUES
(
  gen_random_uuid(),
  'pending',
  true,
  true,
  'Downtown Station',
  'Airport Terminal 1',
  500,
  50,
  false,
  NOW() + INTERVAL '1 hour',
  NOW(),
  (SELECT id FROM users LIMIT 1),
  'John Doe',
  '9876543210',
  ARRAY['a3c7433b-e2d9-4963-b378-30d3996e23af'::uuid]
),
(
  gen_random_uuid(),
  'pending',
  true,
  true,
  'City Center Mall',
  'Railway Station',
  400,
  40,
  false,
  NOW() + INTERVAL '2 hours',
  NOW(),
  (SELECT id FROM users LIMIT 1),
  'Jane Smith',
  '8765432109',
  ARRAY['a3c7433b-e2d9-4963-b378-30d3996e23af'::uuid]
),
(
  gen_random_uuid(),
  'pending',
  true,
  true,
  'Business Park',
  'Shopping District',
  600,
  60,
  false,
  NOW() + INTERVAL '3 hours',
  NOW(),
  (SELECT id FROM users LIMIT 1),
  'Bob Wilson',
  '7654321098',
  ARRAY['a3c7433b-e2d9-4963-b378-30d3996e23af'::uuid]
);

-- Verify trips were created
SELECT 
  id,
  status,
  is_admin_trip,
  admin_assigned_drivers,
  passenger_name,
  pickup_location,
  dropoff_location,
  fare_amount
FROM trips
WHERE is_admin_trip = true
  AND admin_assigned_drivers @> ARRAY['a3c7433b-e2d9-4963-b378-30d3996e23af'::uuid]
ORDER BY created_at DESC
LIMIT 5;
