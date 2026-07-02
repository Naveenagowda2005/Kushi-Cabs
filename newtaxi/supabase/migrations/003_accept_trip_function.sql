-- ============================================================
-- ATOMIC TRIP ACCEPTANCE (prevents race conditions)
-- Called from the app via supabase.rpc('accept_trip', {...})
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
    SELECT * INTO v_driver FROM drivers WHERE user_id = p_user_id;
    IF v_driver.current_trip_id IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', 'You already have an active trip');
    END IF;

    -- Check wallet balance
    SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
    IF v_wallet.balance < p_min_balance THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    -- Assign trip to driver (update status to in_progress)
    UPDATE trips SET
      status      = 'in_progress',
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
