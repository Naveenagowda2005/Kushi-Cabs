-- ============================================================
-- Backfill existing trips with default values for new columns
-- ============================================================

-- Ensure all existing trips have default values (they may have NULLs from before migrations)
UPDATE trips
SET fixed_km = COALESCE(fixed_km, 0)
WHERE fixed_km IS NULL;

UPDATE trips
SET state_tax_included = COALESCE(state_tax_included, FALSE)
WHERE state_tax_included IS NULL;

UPDATE trips
SET pet_travelling = COALESCE(pet_travelling, FALSE)
WHERE pet_travelling IS NULL;

UPDATE trips
SET toll_included = COALESCE(toll_included, FALSE)
WHERE toll_included IS NULL;

-- For return_date, it's OK to be NULL (only round trips should have it)
-- But we can set it to the created_at + 2 days for round trips that might need it
-- Only update if return_location is set and return_date is NULL
UPDATE trips
SET return_date = created_at + INTERVAL '2 days'
WHERE return_location IS NOT NULL 
  AND return_date IS NULL;
