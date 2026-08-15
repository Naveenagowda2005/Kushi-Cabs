-- ============================================================
-- Add display order to trip_segments table
-- ============================================================

ALTER TABLE trip_segments
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update display order for trip segments
UPDATE trip_segments SET display_order = 1 WHERE name = 'Round trips';
UPDATE trip_segments SET display_order = 2 WHERE name = 'One-way';
UPDATE trip_segments SET display_order = 3 WHERE name = 'Airport transfers';
UPDATE trip_segments SET display_order = 4 WHERE name = 'Local Packages';

-- Create index for ordering
CREATE INDEX idx_trip_segments_order ON trip_segments(display_order);
