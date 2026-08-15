-- Migration 095: Add local trip packages
-- Adds standard package options for local trips (e.g., 4/40kms, 8/80kms, 12/120kms)

-- First, get the local trips segment ID and insert packages
INSERT INTO trip_packages (segment_id, name)
SELECT 
  ts.id,
  package.name
FROM trip_segments ts,
LATERAL (
  VALUES
    ('4/40kms'),
    ('8/80kms'),
    ('12/120kms')
) AS package(name)
WHERE ts.name = 'Local trips'
  AND NOT EXISTS (
    SELECT 1 FROM trip_packages tp 
    WHERE tp.segment_id = ts.id 
      AND tp.name = package.name
  );
