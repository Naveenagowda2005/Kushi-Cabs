-- Fix duplicate booking_id_seq values by renumbering them sequentially
-- This will reassign booking_id_seq to be unique for each trip

-- First, create a temporary table with the correct sequential numbering
WITH numbered_trips AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as new_booking_id_seq
  FROM trips
)
UPDATE trips
SET booking_id_seq = numbered_trips.new_booking_id_seq
FROM numbered_trips
WHERE trips.id = numbered_trips.id;

-- Verify the fix - check for any remaining duplicates
SELECT 
  booking_id_seq,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as trip_ids
FROM trips
GROUP BY booking_id_seq
HAVING COUNT(*) > 1;

-- Show the updated booking IDs
SELECT id, booking_id_seq, pickup_location, dropoff_location, status, created_at
FROM trips
ORDER BY booking_id_seq DESC
LIMIT 20;
