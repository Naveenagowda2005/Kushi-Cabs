-- ============================================================
-- Add fixed km field to trips table (REQUIRED)
-- ============================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS fixed_km DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_trips_fixed_km ON trips(fixed_km);
