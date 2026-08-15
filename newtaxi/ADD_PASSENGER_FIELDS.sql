-- ============================================================
-- ADD PASSENGER FIELDS TO TRIPS TABLE
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add passenger name and phone columns to trips table
ALTER TABLE trips 
ADD COLUMN passenger_name TEXT,
ADD COLUMN passenger_phone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN trips.passenger_name IS 'Name of the passenger for this trip';
COMMENT ON COLUMN trips.passenger_phone IS 'Phone number of the passenger for driver contact';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name IN ('passenger_name', 'passenger_phone');

-- Show the updated table structure
\d trips;