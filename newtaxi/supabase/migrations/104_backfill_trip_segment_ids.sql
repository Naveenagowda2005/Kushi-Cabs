-- Backfill missing segment_ids in trips table
-- Many trips may have been created without a segment_id

-- First, get the default segment (usually "One way trips")
DO $$
DECLARE
  v_default_segment_id INT;
BEGIN
  -- Find the first segment by display order
  SELECT id INTO v_default_segment_id 
  FROM trip_segments 
  ORDER BY display_order ASC 
  LIMIT 1;
  
  -- If no segments exist, log error and exit
  IF v_default_segment_id IS NULL THEN
    RAISE NOTICE 'No trip segments found in database!';
    RETURN;
  END IF;
  
  -- Backfill trips with NULL or 0 segment_id
  UPDATE trips 
  SET segment_id = v_default_segment_id
  WHERE segment_id IS NULL OR segment_id = 0;
  
  RAISE NOTICE 'Backfilled missing segment_ids with default segment: %', v_default_segment_id;
END $$;

-- Verify the backfill
SELECT 
  segment_id,
  ts.name as segment_name,
  COUNT(*) as trip_count
FROM trips t
LEFT JOIN trip_segments ts ON t.segment_id = ts.id
GROUP BY segment_id, ts.name
ORDER BY trip_count DESC;
