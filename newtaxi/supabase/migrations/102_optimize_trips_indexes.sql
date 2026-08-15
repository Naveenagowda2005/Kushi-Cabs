-- Comprehensive indexes for trips table performance optimization
-- This fixes timeout issues when fetching trips with filters

-- Drop existing indexes if they exist to avoid conflicts
DROP INDEX IF EXISTS idx_trips_created_by_status;
DROP INDEX IF EXISTS idx_trips_accepted_by_status;
DROP INDEX IF EXISTS idx_trips_vendor_id_status;
DROP INDEX IF EXISTS idx_trips_status_created_at;

-- Primary index: status + created_at for main query filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_created_at_desc 
ON trips(status, created_at DESC);

-- Index for admin created trips filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_is_admin_trip_status 
ON trips(is_admin_trip, status);

-- Index for ordering by created_at (pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_created_at_desc 
ON trips(created_at DESC);

-- Index for status only queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status 
ON trips(status);

-- Index for admin_trip queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_is_admin_trip 
ON trips(is_admin_trip);

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_is_admin 
ON trips(status, is_admin_trip);

-- Add comment for documentation
COMMENT ON INDEX idx_trips_status_created_at_desc IS 'Primary index for fetching trips by status and ordering by creation date';
COMMENT ON INDEX idx_trips_is_admin_trip_status IS 'Index for filtering admin created trips by status';

-- Analyze the table to update query planner statistics
ANALYZE trips;

-- List all created indexes
SELECT 
  indexname,
  indexdef,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE relname = 'trips' 
ORDER BY indexname;
