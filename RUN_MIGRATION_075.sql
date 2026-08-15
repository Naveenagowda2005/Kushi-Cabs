-- ============================================================
-- READY TO RUN: Fix accept_trip to handle vendor-assigned trips
-- ============================================================

CREATE OR REPLACE FUNCTION accept_trip(
  p_trip_id    UUID,
  p_user_id    UUID,
  p_role       TEXT,   -- 'vendor' or 'driver'
  p_min_balance NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_trip        trips%ROWTYPE;
  v_wallet      wallets%ROWTYPE;
  v_driver      drivers%ROWTYPE;
  v_vendor      vendors%ROWTYPE;
BEGIN
  -- Lock the trip row to prevent concurrent acceptance
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  -- Role-specific checks
  IF p_role = 'driver' THEN
    -- For drivers: check status based on whether trip is vendor-assigned
    IF v_trip.driver_id IS NOT NULL THEN
      -- Vendor-assigned trip: allow 'pending' OR 'accepted' status
      IF v_trip.status NOT IN ('pending', 'accepted') THEN
        RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
      END IF;
    ELSE
      -- Public trip: only allow 'pending' status
      IF v_trip.status <> 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
      END IF;
    END IF;

    -- Check driver doesn't already have an active trip
    -- EXCEPTION: If this trip is already assigned to the driver (vendor-assigned), allow accept
    SELECT * INTO v_driver FROM drivers WHERE user_id = p_user_id;
    IF v_driver.current_trip_id IS NOT NULL AND v_driver.current_trip_id != p_trip_id THEN
      -- Driver has a different active trip, so reject
      RETURN json_build_object('success', false, 'error', 'You already have an active trip');
    END IF;

    -- Check wallet balance
    SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
    IF v_wallet.balance < p_min_balance THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    -- Assign trip to driver - KEEP STATUS AS 'accepted'
    -- Status will change to 'in_progress' only when driver clicks "Start Trip"
    UPDATE trips SET
      status      = 'accepted',
      driver_id   = v_driver.id,
      accepted_by = p_user_id,
      accepted_at = NOW()
    WHERE id = p_trip_id;

    -- Mark driver as unavailable
    UPDATE drivers SET
      is_available    = FALSE,
      current_trip_id = p_trip_id
    WHERE user_id = p_user_id;

  ELSIF p_role = 'vendor' THEN
    -- Vendor must only accept pending trips
    IF v_trip.status <> 'pending' THEN
      RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
    END IF;

    -- Vendor must accept within 5-min window
    IF NOW() > v_trip.vendor_visible_until THEN
      RETURN json_build_object('success', false, 'error', 'Vendor acceptance window has expired');
    END IF;

    SELECT * INTO v_vendor FROM vendors WHERE user_id = p_user_id;

    UPDATE trips SET
      status      = 'accepted',
      vendor_id   = v_vendor.id,
      accepted_by = p_user_id,
      accepted_at = NOW()
    WHERE id = p_trip_id;
  END IF;

  RETURN json_build_object('success', true, 'trip_id', p_trip_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up stale current_trip_id values
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT d.user_id, d.id
    FROM drivers d
    WHERE d.current_trip_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM trips t 
      WHERE t.id = d.current_trip_id 
      AND t.status IN ('accepted', 'in_progress')
    )
  LOOP
    UPDATE drivers SET current_trip_id = NULL WHERE user_id = r.user_id;
    RAISE NOTICE 'Reset stale current_trip_id for driver: %', r.user_id;
  END LOOP;
END $$;

SELECT 'Migration 075 applied - accept_trip updated and stale current_trip_id cleaned' as status;
