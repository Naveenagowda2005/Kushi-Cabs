-- Migration 050: Backfill segment_id for existing trips
-- Determines trip type based on whether return_location exists

BEGIN;

-- Get the segment IDs for reference
WITH segment_ids AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY display_order) as rn
  FROM trip_segments
)

UPDATE trips t
SET segment_id = CASE 
  -- If trip has return_location, it's a round trip
  WHEN t.return_location IS NOT NULL THEN (SELECT id FROM trip_segments WHERE name = 'Round trips' LIMIT 1)
  -- Otherwise it's one-way
  ELSE (SELECT id FROM trip_segments WHERE name = 'One-way' LIMIT 1)
END
WHERE t.segment_id IS NULL;

COMMIT;
