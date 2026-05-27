-- Vendor-created trips should be visible to drivers immediately.
-- Override the trigger by updating vendor_visible_until after insert.

CREATE OR REPLACE FUNCTION create_vendor_trip(
  p_created_by     UUID,
  p_vendor_id      UUID,
  p_pickup         TEXT,
  p_dropoff        TEXT,
  p_fare           NUMERIC,
  p_scheduled_at   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_trip_id UUID;
BEGIN
  INSERT INTO trips (
    created_by, vendor_id,
    pickup_location, dropoff_location,
    fare_amount, scheduled_at
  ) VALUES (
    p_created_by, p_vendor_id,
    p_pickup, p_dropoff,
    p_fare, p_scheduled_at
  )
  RETURNING id INTO v_trip_id;

  -- Override the 5-min window: set to past so drivers see it immediately
  UPDATE trips
  SET vendor_visible_until = NOW() - INTERVAL '1 second'
  WHERE id = v_trip_id;

  RETURN json_build_object('success', true, 'trip_id', v_trip_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
