-- ============================================================
-- Add extra_km_charge field to trips table (REQUIRED)
-- ============================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS extra_km_charge DECIMAL(10, 2) DEFAULT 0;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_trips_extra_km_charge ON trips(extra_km_charge);
