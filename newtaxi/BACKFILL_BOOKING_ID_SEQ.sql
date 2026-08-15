-- Backfill booking_id_seq for trips that have NULL values
-- This assigns the sequence starting from 1 for any trip without a booking_id_seq

-- First, check how many trips have NULL booking_id_seq
SELECT COUNT(*) as trips_without_booking_id FROM public.trips WHERE booking_id_seq IS NULL;

-- Update trips with NULL booking_id_seq to use the sequence
UPDATE public.trips 
SET booking_id_seq = nextval('trips_booking_id_seq')
WHERE booking_id_seq IS NULL
ORDER BY created_at ASC;

-- Verify the update
SELECT COUNT(DISTINCT booking_id_seq) as unique_booking_ids, COUNT(*) as total_trips FROM public.trips;

-- Check for any duplicates (should be 0)
SELECT booking_id_seq, COUNT(*) as count 
FROM public.trips 
WHERE booking_id_seq IS NOT NULL 
GROUP BY booking_id_seq 
HAVING COUNT(*) > 1;

-- Display first 10 trips with their booking IDs
SELECT id, booking_id_seq, created_at, status FROM public.trips ORDER BY booking_id_seq ASC LIMIT 10;
