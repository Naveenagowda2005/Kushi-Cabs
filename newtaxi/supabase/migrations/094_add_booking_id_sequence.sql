-- Migration 094: Add booking ID sequence for trips
-- Creates a sequence for generating sequential booking IDs (KUSH-B-000001, KUSH-B-000002, etc.)

-- Create sequence for booking IDs
CREATE SEQUENCE IF NOT EXISTS trips_booking_id_seq START WITH 1 INCREMENT BY 1;

-- Add booking_id_seq column to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS booking_id_seq BIGINT DEFAULT nextval('trips_booking_id_seq');

-- Create unique index on booking_id_seq
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_booking_id_seq ON public.trips(booking_id_seq);

-- Grant permissions
GRANT USAGE ON SEQUENCE trips_booking_id_seq TO authenticated, anon;

COMMENT ON SEQUENCE trips_booking_id_seq IS 'Sequence for generating sequential booking IDs';
COMMENT ON COLUMN trips.booking_id_seq IS 'Sequential booking ID number (KUSH-B-000001, KUSH-B-000002, etc.)';
