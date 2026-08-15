-- Check for duplicate booking_id_seq values
SELECT 
  booking_id_seq,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as trip_ids
FROM trips
GROUP BY booking_id_seq
HAVING COUNT(*) > 1
ORDER BY booking_id_seq;

-- Also show all trips sorted by booking_id_seq to see the pattern
SELECT id, booking_id_seq, pickup_location, dropoff_location, status, created_at
FROM trips
ORDER BY booking_id_seq DESC
LIMIT 20;
