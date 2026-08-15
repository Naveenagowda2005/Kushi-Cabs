-- ============================================================
-- Add return date for round trips
-- (return_location already exists from migration 031)
-- ============================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS return_date TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trips_return_date ON trips(return_date);
