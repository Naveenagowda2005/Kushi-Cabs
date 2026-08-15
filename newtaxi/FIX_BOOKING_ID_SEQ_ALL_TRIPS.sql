-- FIX: Assign unique booking_id_seq to all trips
-- This script will:
-- 1. Reset the sequence to start fresh
-- 2. Assign sequential booking IDs to all trips ordered by creation date
-- 3. Verify all trips have unique booking IDs

-- STEP 1: Check current state
SELECT 
  COUNT(*) as total_trips,
  COUNT(CASE WHEN booking_id_seq IS NULL THEN 1 END) as trips_without_id,
  COUNT(CASE WHEN booking_id_seq IS NOT NULL THEN 1 END) as trips_with_id,
  COUNT(DISTINCT booking_id_seq) as unique_ids
FROM public.trips;

-- STEP 2: Reset the sequence to 1
ALTER SEQUENCE trips_booking_id_seq RESTART WITH 1;

-- STEP 3: Assign booking_id_seq to all trips (ordered by created_at for consistency)
-- This ensures older trips get lower numbers
WITH numbered_trips AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as seq_num
  FROM public.trips
)
UPDATE public.trips t
SET booking_id_seq = nt.seq_num
FROM numbered_trips nt
WHERE t.id = nt.id;

-- STEP 4: Verify the update - all trips should have booking_id_seq now
SELECT 
  COUNT(*) as total_trips,
  COUNT(CASE WHEN booking_id_seq IS NULL THEN 1 END) as trips_without_id,
  COUNT(DISTINCT booking_id_seq) as unique_ids,
  MIN(booking_id_seq) as min_id,
  MAX(booking_id_seq) as max_id
FROM public.trips;

-- STEP 5: Check for any duplicates (should be 0 rows)
SELECT booking_id_seq, COUNT(*) as count 
FROM public.trips 
WHERE booking_id_seq IS NOT NULL 
GROUP BY booking_id_seq 
HAVING COUNT(*) > 1;

-- Step 7: Display sample of trips with their new booking IDs (no padding)
SELECT 
  id,
  booking_id_seq,
  'KUSH-B-' || booking_id_seq::TEXT as formatted_booking_id,
  created_at,
  status
FROM public.trips 
ORDER BY booking_id_seq ASC 
LIMIT 20;

-- STEP 7: Final verification - show distribution
SELECT 
  COUNT(*) as trip_count,
  MIN(booking_id_seq) as min_booking_id,
  MAX(booking_id_seq) as max_booking_id,
  (MAX(booking_id_seq) - MIN(booking_id_seq) + 1) as expected_count,
  CASE 
    WHEN COUNT(*) = (MAX(booking_id_seq) - MIN(booking_id_seq) + 1) THEN '✅ ALL UNIQUE'
    ELSE '❌ DUPLICATES DETECTED'
  END as status
FROM public.trips
WHERE booking_id_seq IS NOT NULL;
