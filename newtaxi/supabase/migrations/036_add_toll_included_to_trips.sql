-- ============================================================
-- ADD TOLL INCLUDED FIELD TO TRIPS TABLE
-- ============================================================

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS toll_included BOOLEAN DEFAULT false;

-- Add comment to document the column purpose
COMMENT ON COLUMN trips.toll_included IS 'Indicates whether toll charges are included in the trip fare';
