-- ============================================================
-- V2: Cancel trip, driver stats, commission update
-- ============================================================

-- Cancel trip (driver or vendor can cancel their own accepted trip)
CREATE OR REPLACE FUNCTION cancel_trip(
  p_trip_id UUID,
  p_user_id UUID,
  p_reason  TEXT DEFAULT 'Cancelled by user'
)
RETURNS JSON AS $$
DECLARE
  v_trip trips%ROWTYPE;
BEGIN
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  IF v_trip.status NOT IN ('pending', 'accepted') THEN
    RETURN json_build_object('success', false, 'error', 'Cannot cancel a trip that is in progress or completed');
  END IF;

  -- Only the assigned driver/vendor or admin can cancel
  IF v_trip.accepted_by IS NOT NULL AND v_trip.accepted_by <> p_user_id THEN
    IF (SELECT get_my_role()) <> 'admin' THEN
      RETURN json_build_object('success', false, 'error', 'Not authorized to cancel this trip');
    END IF;
  END IF;

  UPDATE trips SET
    status       = 'cancelled',
    completed_at = NOW()
  WHERE id = p_trip_id;

  -- Free driver if assigned
  IF v_trip.driver_id IS NOT NULL THEN
    UPDATE drivers SET
      is_available    = TRUE,
      current_trip_id = NULL
    WHERE id = v_trip.driver_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update vendor commission
CREATE OR REPLACE FUNCTION update_commission(
  p_user_id      UUID,
  p_commission   NUMERIC
)
RETURNS JSON AS $$
BEGIN
  IF p_commission < 0 OR p_commission > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Commission must be between 0 and 100');
  END IF;

  UPDATE vendors SET commission_pct = p_commission
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Driver stats view
CREATE OR REPLACE VIEW driver_stats AS
SELECT
  d.user_id,
  COUNT(t.id) FILTER (WHERE t.status = 'completed')  AS total_trips,
  COUNT(t.id) FILTER (WHERE t.status = 'cancelled')  AS cancelled_trips,
  COALESCE(SUM(t.fare_amount) FILTER (WHERE t.status = 'completed'), 0) AS total_earned,
  COALESCE(AVG(t.fare_amount) FILTER (WHERE t.status = 'completed'), 0) AS avg_fare,
  COALESCE(SUM(t.end_km - t.start_km) FILTER (WHERE t.status = 'completed' AND t.end_km IS NOT NULL), 0) AS total_km
FROM drivers d
LEFT JOIN trips t ON t.driver_id = d.id
GROUP BY d.user_id;
