-- RUN THIS IN SUPABASE SQL EDITOR
-- https://app.supabase.com/project/{YOUR_PROJECT}/sql/new

-- Add hills_included column to trips table
ALTER TABLE public.trips
ADD COLUMN hills_included BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN public.trips.hills_included IS 'Whether hills charge is included in the trip fare';
