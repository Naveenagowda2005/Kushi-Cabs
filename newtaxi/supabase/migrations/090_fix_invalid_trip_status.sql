-- Fix invalid trip status values
-- This migration corrects trips with invalid status like "started" to valid enum values

BEGIN;

-- Fix trips with "started" status to "in_progress"
UPDATE trips 
SET status = 'in_progress'::trip_status
WHERE status::TEXT = 'started';

-- Fix any other invalid statuses to "pending" by default
-- This catches any other corrupted data
UPDATE trips 
SET status = 'pending'::trip_status
WHERE status::TEXT NOT IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Log the changes
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM trips
  WHERE status::TEXT NOT IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'Warning: Found % trips with invalid status values', invalid_count;
  ELSE
    RAISE NOTICE 'All trip status values are now valid';
  END IF;
END $$;

COMMIT;
