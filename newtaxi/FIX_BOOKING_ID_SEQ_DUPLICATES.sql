-- Fix: Remove duplicates and reassign all booking_id_seq values
-- This script will:
-- 1. Drop the unique index that's causing conflicts
-- 2. Clear all existing booking_id_seq values
-- 3. Reset the sequence to 1
-- 4. Assign fresh sequential numbers to all trips
-- 5. Recreate the unique index

-- STEP 1: Check current state - see how many duplicates exist
SELECT booking_id_seq, COUNT(*) as count 
FROM public.trips 
WHERE booking_id_seq IS NOT NULL 
GROUP BY booking_id_seq 
HAVING COUNT(*) > 1
ORDER BY booking_id_seq;

-- STEP 2: Drop the unique index that's blocking the update
DROP INDEX IF EXISTS public.idx_trips_booking_id_seq;

-- STEP 3: Clear all existing booking_id_seq values
UPDATE public.trips SET booking_id_seq = NULL;

-- STEP 4: Reset the sequence to start from 1
ALTER SEQUENCE public.trips_booking_id_seq RESTART WITH 1;

-- STEP 5: Assign fresh sequential numbers to all trips (ordered by created_at)
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

-- STEP 6: Verify all trips now have unique booking_id_seq
SELECT 
  COUNT(*) as total_trips,
  COUNT(DISTINCT booking_id_seq) as unique_ids,
  MIN(booking_id_seq) as min_id,
  MAX(booking_id_seq) as max_id,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT booking_id_seq) THEN '✅ ALL UNIQUE'
    ELSE '❌ DUPLICATES STILL EXIST'
  END as status
FROM public.trips
WHERE booking_id_seq IS NOT NULL;

-- STEP 7: Recreate the unique index
CREATE UNIQUE INDEX idx_trips_booking_id_seq 
ON public.trips(booking_id_seq) 
WHERE booking_id_seq IS NOT NULL;

-- STEP 8: Show sample of trips with their booking IDs
SELECT 
  id,
  booking_id_seq,
  'KUSH-B-' || booking_id_seq::TEXT as formatted_booking_id,
  created_at
FROM public.trips 
ORDER BY booking_id_seq ASC 
LIMIT 20;

-- STEP 9: Final verification - check for any duplicates (should return 0 rows)
SELECT booking_id_seq, COUNT(*) as count 
FROM public.trips 
WHERE booking_id_seq IS NOT NULL 
GROUP BY booking_id_seq 
HAVING COUNT(*) > 1;
