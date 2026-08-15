-- ============================================================
-- Migration: Add passenger_name and passenger_phone to trips table
-- Purpose: Store customer/passenger information for each trip
-- ============================================================

-- Add passenger_name column
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS passenger_name TEXT;

-- Add passenger_phone column
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS passenger_phone TEXT;

-- Add comments
COMMENT ON COLUMN public.trips.passenger_name IS 
  'Name of the passenger/customer for this trip';

COMMENT ON COLUMN public.trips.passenger_phone IS 
  'Phone number of the passenger/customer for this trip';

-- Create indexes for searching by passenger info
CREATE INDEX IF NOT EXISTS idx_trips_passenger_name ON public.trips(passenger_name);
CREATE INDEX IF NOT EXISTS idx_trips_passenger_phone ON public.trips(passenger_phone);
