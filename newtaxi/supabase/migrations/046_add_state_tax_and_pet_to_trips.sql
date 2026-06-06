-- ============================================================
-- Add state tax and pet travelling flags to trips table
-- ============================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS state_tax_included BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pet_travelling BOOLEAN DEFAULT FALSE;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_trips_state_tax ON trips(state_tax_included);
CREATE INDEX IF NOT EXISTS idx_trips_pet ON trips(pet_travelling);
