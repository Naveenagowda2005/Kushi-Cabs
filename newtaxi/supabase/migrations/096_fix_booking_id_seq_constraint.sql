-- Fix booking_id_seq constraint issue
-- Drop the problematic unique constraint and recreate with proper sequence handling

BEGIN;

-- First, check and drop the constraint if it exists
ALTER TABLE trips DROP CONSTRAINT IF EXISTS idx_trips_booking_id_seq;

-- Drop the old sequence if it exists
DROP SEQUENCE IF EXISTS trips_booking_id_seq_seq CASCADE;

-- Create a new sequence for booking_id_seq
CREATE SEQUENCE trips_booking_id_seq_seq START WITH 1 INCREMENT BY 1;

-- Update existing trips that have booking_id_seq to use the sequence
-- This ensures all existing records have unique sequential IDs
UPDATE trips SET booking_id_seq = nextval('trips_booking_id_seq_seq') 
WHERE booking_id_seq IS NULL OR booking_id_seq = 0;

-- Add a unique constraint on booking_id_seq (allowing NULL if needed)
ALTER TABLE trips ADD CONSTRAINT idx_trips_booking_id_seq_unique UNIQUE (booking_id_seq);

-- Set the default value for new trips to use the sequence
ALTER TABLE trips ALTER COLUMN booking_id_seq SET DEFAULT nextval('trips_booking_id_seq_seq');

COMMIT;
