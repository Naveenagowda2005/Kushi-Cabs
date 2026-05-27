-- ============================================================
-- SET DEFAULT CUSTOMER PRE-ADVANCE FOR EXISTING TRIPS
-- ============================================================

-- Update all existing trips that have NULL customer_pre_advance to 0
UPDATE trips 
SET customer_pre_advance = 0 
WHERE customer_pre_advance IS NULL;

-- Add NOT NULL constraint with default value
ALTER TABLE trips 
ALTER COLUMN customer_pre_advance SET DEFAULT 0;
