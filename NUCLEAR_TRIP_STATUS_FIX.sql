-- NUCLEAR OPTION - Fix all trip statuses comprehensively
-- Use this if PERMANENT_FIX didn't work

BEGIN;

-- Step 1: Create a temporary table to backup the data
CREATE TEMP TABLE trips_backup AS SELECT * FROM trips;

-- Step 2: Show what we're about to fix
SELECT 'Before Fix' as phase, COUNT(*) as total_trips, 
       COUNT(DISTINCT status) as unique_statuses,
       string_agg(DISTINCT status::TEXT, ', ' ORDER BY status::TEXT) as all_statuses
FROM trips;

-- Step 3: Update by casting to TEXT and back, handling any edge case
UPDATE trips
SET status = CASE 
  WHEN LOWER(TRIM(status::TEXT)) = 'started' THEN 'in_progress'::trip_status
  WHEN LOWER(TRIM(status::TEXT)) = 'awaiting_payment' THEN 'completed'::trip_status
  WHEN LOWER(TRIM(status::TEXT)) = 'pending' THEN 'pending'::trip_status
  WHEN LOWER(TRIM(status::TEXT)) = 'accepted' THEN 'accepted'::trip_status
  WHEN LOWER(TRIM(status::TEXT)) = 'in_progress' THEN 'in_progress'::trip_status
  WHEN LOWER(TRIM(status::TEXT)) = 'completed' THEN 'completed'::trip_status
  WHEN LOWER(TRIM(status::TEXT)) = 'cancelled' THEN 'cancelled'::trip_status
  ELSE 'pending'::trip_status
END
WHERE status IS NOT NULL;

-- Step 4: Show results
SELECT 'After Fix' as phase, COUNT(*) as total_trips,
       COUNT(DISTINCT status) as unique_statuses,
       string_agg(DISTINCT status::TEXT, ', ' ORDER BY status::TEXT) as all_statuses
FROM trips;

-- Step 5: List all status values with counts
SELECT status::TEXT as status, COUNT(*) as trip_count
FROM trips
GROUP BY status::TEXT
ORDER BY status::TEXT;

-- Step 6: Final validation - should be 0
SELECT COUNT(*) as invalid_trips_remaining
FROM trips
WHERE status::TEXT NOT IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Step 7: Show any trips that were fixed
SELECT COUNT(*) as trips_that_were_invalid
FROM trips t
WHERE EXISTS (
  SELECT 1 FROM trips_backup b 
  WHERE b.id = t.id 
  AND b.status::TEXT != t.status::TEXT
);

COMMIT;
