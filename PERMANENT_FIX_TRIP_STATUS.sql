-- PERMANENT FIX for invalid trip status values
-- This will find and fix ALL invalid status values including those that are text

-- Step 1: Check current state
SELECT COUNT(*) as total_trips, 
       COUNT(DISTINCT status) as unique_statuses
FROM trips;

-- Step 2: Show all status values including invalid ones
SELECT status, COUNT(*) as count 
FROM trips 
GROUP BY status 
ORDER BY status;

-- Step 3: Fix all invalid statuses by converting text directly
-- Use CASE statement to handle all scenarios
UPDATE trips
SET status = CASE 
  WHEN status::TEXT = 'started' THEN 'in_progress'::trip_status
  WHEN status::TEXT = 'awaiting_payment' THEN 'completed'::trip_status
  WHEN status::TEXT = 'pending' THEN 'pending'::trip_status
  WHEN status::TEXT = 'accepted' THEN 'accepted'::trip_status
  WHEN status::TEXT = 'in_progress' THEN 'in_progress'::trip_status
  WHEN status::TEXT = 'completed' THEN 'completed'::trip_status
  WHEN status::TEXT = 'cancelled' THEN 'cancelled'::trip_status
  ELSE 'pending'::trip_status
END
WHERE status IS NOT NULL;

-- Step 4: Verify all are fixed
SELECT DISTINCT status FROM trips ORDER BY status;

-- Step 5: Show final count
SELECT COUNT(*) as total_trips, 
       COUNT(DISTINCT status) as unique_statuses
FROM trips;

-- Step 6: Double-check no invalid values remain
SELECT COUNT(*) as invalid_status_count
FROM trips
WHERE status::TEXT NOT IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
