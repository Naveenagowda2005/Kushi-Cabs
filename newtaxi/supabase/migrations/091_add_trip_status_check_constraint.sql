-- Add CHECK constraint to prevent invalid trip status values from being inserted
-- This is a safety measure to ensure data integrity

BEGIN;

-- Add constraint to ensure only valid status values are allowed
ALTER TABLE trips
ADD CONSTRAINT valid_trip_status CHECK (
  status::TEXT IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')
);

-- Verify constraint was created
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_name = 'trips' AND constraint_name = 'valid_trip_status';

COMMIT;
