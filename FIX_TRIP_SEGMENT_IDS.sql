-- Check trip_segments available
SELECT id, name FROM trip_segments ORDER BY display_order;

-- Check trips with NULL or 0 segment_id
SELECT COUNT(*) as trips_without_segment_id FROM trips WHERE segment_id IS NULL OR segment_id = 0;

-- Check what segment_ids exist in trips
SELECT segment_id, COUNT(*) FROM trips GROUP BY segment_id ORDER BY COUNT(*) DESC;

-- Get first segment ID (usually is One way trips / Default)
SELECT id, name FROM trip_segments ORDER BY display_order LIMIT 1;

-- BACKFILL: Set default segment_id for all trips that don't have one
-- First identify the default segment (usually the first one)
UPDATE trips 
SET segment_id = (SELECT id FROM trip_segments ORDER BY display_order LIMIT 1)
WHERE segment_id IS NULL OR segment_id = 0;

-- Verify the update
SELECT COUNT(*) as trips_with_segment_id FROM trips WHERE segment_id IS NOT NULL AND segment_id != 0;
