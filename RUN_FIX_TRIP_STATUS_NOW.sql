-- Immediately fix invalid trip status values in production
-- Run this in Supabase SQL Editor

-- First, check how many invalid status trips exist
SELECT COUNT(*) as invalid_trip_count,
       COUNT(DISTINCT status) as distinct_statuses
FROM trips
WHERE status IS NOT NULL;

-- Show all distinct status values (including invalid ones)
SELECT DISTINCT status FROM trips ORDER BY status;

-- Fix "started" status to "in_progress"
UPDATE trips 
SET status = 'in_progress'::trip_status
WHERE LOWER(CAST(status AS TEXT)) = 'started'
   OR status::TEXT = 'started';

-- Fix "awaiting_payment" to "completed"
UPDATE trips 
SET status = 'completed'::trip_status
WHERE LOWER(CAST(status AS TEXT)) = 'awaiting_payment'
   OR status::TEXT = 'awaiting_payment';

-- Verify all statuses are now valid
SELECT DISTINCT status FROM trips ORDER BY status;

-- Confirm count of fixed trips
SELECT COUNT(*) as total_trips_with_valid_status FROM trips;
