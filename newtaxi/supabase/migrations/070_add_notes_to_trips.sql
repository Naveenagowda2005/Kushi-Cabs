-- Add notes column to trips table
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.trips.notes IS 'Optional special instructions or notes for the trip';
