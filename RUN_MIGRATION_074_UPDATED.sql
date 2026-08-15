-- ============================================================
-- UPDATED MIGRATION 074 - RUN IN SUPABASE SQL EDITOR
-- This fixes driver redirect issue by keeping status = 'accepted'
-- Driver clicks "Start Trip" to change to 'in_progress'
-- ============================================================

CREATE OR REPLACE FUNCTION accept_trip(
  p_trip_id    UUID,
  p_user_id    UUID,
  p_role       TEXT,
  p_min_balance NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_trip        trips%ROWTYPE;
  v_wallet      wallets%ROWTYPE;
  v_driver      drivers%ROWTYPE;
  v_vendor      vendors%ROWTYPE;
BEGIN
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  IF p_role = 'driver' THEN
    -- Check if vendor-assigned (driver_id set) or public (driver_id NULL)
    IF v_trip.driver_id IS NOT NULL THEN
      -- Vendor-assigned: allow 'pending' OR 'accepted'
      IF v_trip.status NOT IN ('pending', 'accepted') THEN
        RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
      END IF;
    ELSE
      -- Public: only allow 'pending'
      IF v_trip.status <> 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
      END IF;
    END IF;

    SELECT * INTO v_driver FROM drivers WHERE user_id = p_user_id;
    IF v_driver.current_trip_id IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', 'You already have an active trip');
    END IF;

    SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
    IF v_wallet.balance < p_min_balance THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    -- IMPORTANT: Keep status as 'accepted' - do NOT change to 'in_progress'
    -- Driver clicks "Start Trip" button to trigger status change to 'in_progress'
    -- This allows driver to upload start odometer BEFORE starting trip
    UPDATE trips SET
      status      = 'accepted',
      driver_id   = v_driver.id,
      accepted_by = p_user_id,
      accepted_at = NOW()
    WHERE id = p_trip_id;

    UPDATE drivers SET
      is_available    = FALSE,
      current_trip_id = p_trip_id
    WHERE user_id = p_user_id;

  ELSIF p_role = 'vendor' THEN
    IF v_trip.status <> 'pending' THEN
      RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
    END IF;

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

-- Verify
SELECT 'Migration 074 Updated - Driver can now upload start odometer after accepting';
