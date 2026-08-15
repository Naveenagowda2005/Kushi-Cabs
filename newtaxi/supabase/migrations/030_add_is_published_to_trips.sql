-- ============================================================
-- ADD IS_PUBLISHED COLUMN TO TRIPS TABLE
-- Allows manual control over trip visibility to drivers
-- ============================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trips_is_published ON trips(is_published);
CREATE INDEX IF NOT EXISTS idx_trips_status_published ON trips(status, is_published);
