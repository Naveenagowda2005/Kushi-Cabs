-- Immediate fix for booking_id_seq duplicate constraint error
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop the problematic constraint
ALTER TABLE trips DROP CONSTRAINT IF EXISTS idx_trips_booking_id_seq;

-- Create a new sequence
DROP SEQUENCE IF EXISTS trips_booking_id_seq_seq CASCADE;
CREATE SEQUENCE trips_booking_id_seq_seq START WITH 1 INCREMENT BY 1;

-- Get the max booking_id_seq from existing trips
-- and restart the sequence from max + 1
SELECT setval('trips_booking_id_seq_seq', COALESCE((SELECT MAX(booking_id_seq) FROM trips), 0) + 1);

-- Ensure all trips have unique booking_id_seq values
-- If there are duplicates, we need to renumber them
WITH numbered_trips AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_seq
  FROM trips
  WHERE booking_id_seq IS NULL OR booking_id_seq = 0
)
UPDATE trips t
SET booking_id_seq = nt.new_seq
FROM numbered_trips nt
WHERE t.id = nt.id;

-- Add unique constraint back
ALTER TABLE trips ADD CONSTRAINT idx_trips_booking_id_seq_unique UNIQUE (booking_id_seq);

-- Set default to use sequence
ALTER TABLE trips ALTER COLUMN booking_id_seq SET DEFAULT nextval('trips_booking_id_seq_seq');

COMMIT;
