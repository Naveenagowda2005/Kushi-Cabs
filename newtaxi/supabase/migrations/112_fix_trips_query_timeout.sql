-- Fix statement timeout in TripHistoryScreen
-- The existing indexes only work for completed trips
-- We need indexes that work for ALL statuses

-- Drop the conditional indexes (they're too narrow)
DROP INDEX IF EXISTS idx_trips_created_by_status;
DROP INDEX IF EXISTS idx_trips_accepted_by_status;
DROP INDEX IF EXISTS idx_trips_vendor_id_status;
DROP INDEX IF EXISTS idx_trips_status_created_at;

-- Create broader indexes for vendor trip queries
CREATE INDEX IF NOT EXISTS idx_trips_vendor_id_created_at 
ON trips(vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trips_created_by_created_at 
ON trips(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trips_accepted_by_created_at 
ON trips(accepted_by, created_at DESC);

-- Composite index for status filtering
CREATE INDEX IF NOT EXISTS idx_trips_status 
ON trips(status, created_at DESC);
