-- Check how many trips vendor 1c0c8ff0-83d4-4507-8b34-2160821e9a76 created
SELECT 
  COUNT(*) as total_trips,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
  COUNT(CASE WHEN start_odometer_url IS NOT NULL THEN 1 END) as with_start_odometer,
  COUNT(CASE WHEN end_odometer_url IS NOT NULL THEN 1 END) as with_end_odometer
FROM trips 
WHERE created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR vendor_id = '1c0c8ff0-83d4-4507-8b34-2160821e9a76';

-- Also get breakdown by role (what role does this user have)
SELECT id, full_name, email, role_id FROM users 
WHERE id = '1c0c8ff0-83d4-4507-8b34-2160821e9a76';

-- Get detailed trip list
SELECT 
  id,
  booking_id_seq,
  status,
  fare_amount,
  pickup_location,
  dropoff_location,
  created_at,
  completed_at,
  start_odometer_url,
  end_odometer_url,
  created_by,
  accepted_by
FROM trips 
WHERE created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR vendor_id = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
ORDER BY created_at DESC
LIMIT 50;
