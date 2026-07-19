-- Create optimized RPC function to fetch trips with filters
-- This bypasses RLS and uses database-level filtering for performance

CREATE OR REPLACE FUNCTION get_trips_paginated(
  p_status TEXT DEFAULT NULL,
  p_is_admin_trip BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  booking_id_seq INT,
  status TEXT,
  fare_amount NUMERIC,
  pickup_location TEXT,
  dropoff_location TEXT,
  return_location TEXT,
  return_date DATE,
  passenger_name TEXT,
  passenger_phone TEXT,
  car_type TEXT,
  car_model TEXT,
  seater_type TEXT,
  fuel_type TEXT,
  segment_id INT,
  package_id INT,
  fixed_km NUMERIC,
  commission_amount NUMERIC,
  customer_pre_advance NUMERIC,
  toll_included BOOLEAN,
  state_tax_included BOOLEAN,
  pet_travelling BOOLEAN,
  hills_included BOOLEAN,
  notes TEXT,
  start_km NUMERIC,
  end_km NUMERIC,
  start_odometer_url TEXT,
  end_odometer_url TEXT,
  created_at TIMESTAMP,
  accepted_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by UUID,
  accepted_by UUID,
  admin_assigned_drivers UUID[],
  is_admin_trip BOOLEAN,
  total_count INT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    t.id,
    t.booking_id_seq,
    t.status,
    t.fare_amount,
    t.pickup_location,
    t.dropoff_location,
    t.return_location,
    t.return_date,
    t.passenger_name,
    t.passenger_phone,
    t.car_type,
    t.car_model,
    t.seater_type,
    t.fuel_type,
    t.segment_id,
    t.package_id,
    t.fixed_km,
    t.commission_amount,
    t.customer_pre_advance,
    t.toll_included,
    t.state_tax_included,
    t.pet_travelling,
    t.hills_included,
    t.notes,
    t.start_km,
    t.end_km,
    t.start_odometer_url,
    t.end_odometer_url,
    t.created_at,
    t.accepted_at,
    t.started_at,
    t.completed_at,
    t.created_by,
    t.accepted_by,
    t.admin_assigned_drivers,
    t.is_admin_trip,
    COUNT(*) OVER() as total_count
  FROM trips t
  WHERE
    (p_status IS NULL OR t.status = p_status)
    AND (p_is_admin_trip IS NULL OR t.is_admin_trip = p_is_admin_trip)
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$ ;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_trips_paginated TO authenticated;

-- Create index for the function to use
CREATE INDEX IF NOT EXISTS idx_trips_status_created_at_desc_v2 
ON trips(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trips_is_admin_created_at_desc 
ON trips(is_admin_trip, created_at DESC);

-- Analyze to help query planner
ANALYZE trips;
