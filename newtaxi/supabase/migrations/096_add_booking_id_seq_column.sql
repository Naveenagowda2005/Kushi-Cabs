-- Migration 096: Add booking_id_seq column to trips table if it doesn't exist
-- This creates the sequence and column needed for unique booking IDs

-- Step 1: Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS public.trips_booking_id_seq 
  START WITH 1 
  INCREMENT BY 1 
  MINVALUE 1 
  MAXVALUE 9223372036854775807 
  CACHE 1;

-- Step 2: Add booking_id_seq column to trips table if it doesn't exist
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS booking_id_seq BIGINT;

-- Step 3: Set default for new rows
ALTER TABLE public.trips 
ALTER COLUMN booking_id_seq SET DEFAULT nextval('public.trips_booking_id_seq');

-- Step 4: Create unique index on booking_id_seq
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_booking_id_seq 
ON public.trips(booking_id_seq) 
WHERE booking_id_seq IS NOT NULL;

-- Step 5: Backfill existing rows with NULL booking_id_seq
-- Assign sequential numbers to all trips that don't have a booking_id_seq yet
WITH numbered_trips AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as seq_num
  FROM public.trips
  WHERE booking_id_seq IS NULL
)
UPDATE public.trips t
SET booking_id_seq = nt.seq_num
FROM numbered_trips nt
WHERE t.id = nt.id;

-- Step 6: Verify the setup
SELECT 
  COUNT(*) as total_trips,
  COUNT(CASE WHEN booking_id_seq IS NULL THEN 1 END) as trips_without_id,
  COUNT(DISTINCT booking_id_seq) as unique_booking_ids,
  MIN(booking_id_seq) as min_id,
  MAX(booking_id_seq) as max_id
FROM public.trips;

-- Step 7: Grant permissions on sequence
GRANT USAGE, SELECT ON SEQUENCE public.trips_booking_id_seq TO authenticated, anon;

-- Step 8: Add comment
COMMENT ON SEQUENCE public.trips_booking_id_seq IS 'Sequence for generating sequential booking IDs (KUSH-B-000001, KUSH-B-000002, etc.)';
COMMENT ON COLUMN public.trips.booking_id_seq IS 'Sequential booking ID number for trip identification';
