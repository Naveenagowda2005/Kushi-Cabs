-- Add indexes to improve trip query performance
-- This fixes timeout issues when fetching completed trips

-- Index for fetching trips by created_by and status
CREATE INDEX IF NOT EXISTS idx_trips_created_by_status 
ON trips(created_by, status) 
WHERE status = 'completed';

-- Index for fetching trips by accepted_by and status
CREATE INDEX IF NOT EXISTS idx_trips_accepted_by_status 
ON trips(accepted_by, status) 
WHERE status = 'completed';

-- Index for fetching trips by vendor_id and status
CREATE INDEX IF NOT EXISTS idx_trips_vendor_id_status 
ON trips(vendor_id, status) 
WHERE status = 'completed';

-- General index for status ordering
CREATE INDEX IF NOT EXISTS idx_trips_status_created_at 
ON trips(status, created_at DESC) 
WHERE status IN ('completed', 'pending', 'accepted', 'in_progress');
