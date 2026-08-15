-- ============================================================
-- Migration 108: Add performance indexes for trips table
-- Fixes timeout when fetching completed trips in super admin
-- ============================================================

-- Composite index: status + created_at DESC (covers ORDER BY + WHERE status = ...)
-- This makes completed trips queries fast regardless of table size
CREATE INDEX IF NOT EXISTS idx_trips_status_created_at_desc
ON trips(status, created_at DESC);

-- Partial index specifically for completed trips (most queried in admin screen)
CREATE INDEX IF NOT EXISTS idx_trips_completed_created_at
ON trips(created_at DESC)
WHERE status = 'completed';

-- Partial index for cancelled trips
CREATE INDEX IF NOT EXISTS idx_trips_cancelled_created_at
ON trips(created_at DESC)
WHERE status = 'cancelled';

-- Partial index for pending trips
CREATE INDEX IF NOT EXISTS idx_trips_pending_created_at
ON trips(created_at DESC)
WHERE status = 'pending';

-- Composite for admin trip filter + status + date
CREATE INDEX IF NOT EXISTS idx_trips_admin_status_created
ON trips(is_admin_trip, status, created_at DESC);
