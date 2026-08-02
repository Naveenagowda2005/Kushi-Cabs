-- Check what's really happening with vendor 1c0c8ff0-83d4-4507-8b34-2160821e9a76
-- This vendor has 50+ trips total but app shows only 2

-- Step 1: Count all trips for this vendor
SELECT 
  COUNT(*) as total_trips,
  COUNT(CASE WHEN start_odometer_url IS NOT NULL THEN 1 END) as with_start_odometer,
  COUNT(CASE WHEN end_odometer_url IS NOT NULL THEN 1 END) as with_end_odometer,
  COUNT(CASE WHEN start_odometer_url IS NOT NULL OR end_odometer_url IS NOT NULL THEN 1 END) as with_any_odometer
FROM trips 
WHERE created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76';

-- Step 2: What trips with odometer images?
SELECT COUNT(*) as trips_with_images
FROM trips 
WHERE (created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76')
AND (start_odometer_url IS NOT NULL OR end_odometer_url IS NOT NULL);

-- Step 3: Exactly which trips have images
SELECT 
  id,
  booking_id_seq,
  status,
  created_by,
  accepted_by,
  start_odometer_url IS NOT NULL as has_start,
  end_odometer_url IS NOT NULL as has_end,
  created_at
FROM trips 
WHERE (created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76')
AND (start_odometer_url IS NOT NULL OR end_odometer_url IS NOT NULL)
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: All trips breakdown by status
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN start_odometer_url IS NOT NULL OR end_odometer_url IS NOT NULL THEN 1 END) as with_images
FROM trips 
WHERE created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
GROUP BY status;
