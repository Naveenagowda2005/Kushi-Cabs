-- Create trip_segments table
CREATE TABLE IF NOT EXISTS trip_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create trip_packages table (for distance-based packages)
CREATE TABLE IF NOT EXISTS trip_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES trip_segments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  distance_km DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add segment_id and package_id to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES trip_segments(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES trip_packages(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_location TEXT;

-- Insert trip segments
INSERT INTO trip_segments (name, description) VALUES
  ('Round trips', 'Return journey with pickup and return location'),
  ('One-way', 'Single journey from pickup to dropoff'),
  ('Airport transfers', 'Dedicated airport transfer service'),
  ('Local Packages', 'Local area packages with fixed distances')
ON CONFLICT (name) DO NOTHING;

-- Insert trip packages for Local Packages segment
INSERT INTO trip_packages (segment_id, name, distance_km)
SELECT id, '4/40kms', 4 FROM trip_segments WHERE name = 'Local Packages'
ON CONFLICT DO NOTHING;

INSERT INTO trip_packages (segment_id, name, distance_km)
SELECT id, '8/80kms', 8 FROM trip_segments WHERE name = 'Local Packages'
ON CONFLICT DO NOTHING;

INSERT INTO trip_packages (segment_id, name, distance_km)
SELECT id, '12/120kms', 12 FROM trip_segments WHERE name = 'Local Packages'
ON CONFLICT DO NOTHING;
