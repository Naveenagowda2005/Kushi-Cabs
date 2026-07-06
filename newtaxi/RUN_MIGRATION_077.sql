-- ✅ VENDOR READ STATUS MIGRATION - RUN THIS IN SUPABASE SQL EDITOR
-- This adds the vendor_read_at column to track when vendors view trip enquiries

-- Add vendor_read_at field to track when vendor first views a trip
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vendor_read_at TIMESTAMPTZ;

-- Add comment for clarity
COMMENT ON COLUMN trips.vendor_read_at IS 'Timestamp when vendor first viewed/read this trip in the enquiries list';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_vendor_read_at ON trips(vendor_read_at);

-- ✅ DONE! 
-- The NEW badge will now show on all unread trips (where vendor_read_at IS NULL)
-- Once a vendor accepts or views a trip, it gets marked as read and badge disappears
