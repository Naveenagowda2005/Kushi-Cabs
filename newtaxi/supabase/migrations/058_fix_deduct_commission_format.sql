-- ============================================================
-- FIX: deduct_commission format() type specifier error
-- Migration: 058_fix_deduct_commission_format.sql
-- ============================================================
-- ERROR: unrecognized format() type specifier "."
-- CAUSE: format() with %s followed by %% or special chars
-- FIX: Replace format() calls with plain string concatenation
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_commission(
  p_trip_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_trip                trips%ROWTYPE;
  v_wallet              wallets%ROWTYPE;
  v_commission          NUMERIC;
  v_commission_type     TEXT;
  v_commission_value    NUMERIC;
  v_driver_earning      NUMERIC;
  v_customer_preadvance NUMERIC;
  v_commission_to_pay   NUMERIC;
  v_remaining_preadvance NUMERIC;
  v_vendor_wallet_id    UUID;
BEGIN
  -- Fetch trip
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  -- Fetch driver wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found for user: ' || p_user_id::text);
  END IF;

  -- Fetch commission settings
  SELECT vendor_commission_type, vendor_commission_value
  INTO v_commission_type, v_commission_value
  FROM app_settings
  WHERE id = 'global';

  IF v_commission_type IS NULL OR v_commission_value IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commission settings not found in app_settings');
  END IF;

  -- Calculate commission
  IF v_commission_type = 'percentage' THEN
    v_commission := (v_trip.fare_amount * v_commission_value) / 100;
  ELSE
    v_commission := v_commission_value;
  END IF;

  v_customer_preadvance   := COALESCE(v_trip.customer_pre_advance, 0);
  v_commission_to_pay     := GREATEST(0, v_commission - v_customer_preadvance);
  v_remaining_preadvance  := GREATEST(0, v_customer_preadvance - v_commission);
  v_driver_earning        := v_trip.fare_amount - v_commission;

  -- Update driver wallet
  UPDATE wallets SET
    balance    = balance + v_driver_earning,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Driver earning transaction — use || concatenation, no format()
  INSERT INTO transactions (wallet_id, trip_id, type, amount, description)
  VALUES (
    v_wallet.id,
    p_trip_id,
    'credit',
    v_driver_earning,
    'Trip earning (Fare: ' || v_trip.fare_amount::text || ' - Commission: ' || v_commission::text || ')'
  );

  -- Update vendor wallet
  UPDATE wallets SET
    balance    = balance + v_commission,
    updated_at = NOW()
  WHERE user_id = v_trip.created_by;

  -- Get vendor wallet id
  SELECT id INTO v_vendor_wallet_id FROM wallets WHERE user_id = v_trip.created_by;

  -- Vendor commission transaction — use || concatenation, no format()
  INSERT INTO transactions (wallet_id, trip_id, type, amount, description)
  VALUES (
    v_vendor_wallet_id,
    p_trip_id,
    'commission',
    v_commission,
    'Commission ' || v_commission_value::text || '% on trip'
  );

  -- Update trip with commission amount
  UPDATE trips SET
    commission_amount = v_commission,
    updated_at        = NOW()
  WHERE id = p_trip_id;

  RETURN json_build_object(
    'success',               true,
    'commission',            v_commission,
    'commission_to_pay',     v_commission_to_pay,
    'commission_type',       v_commission_type,
    'commission_value',      v_commission_value,
    'customer_preadvance',   v_customer_preadvance,
    'remaining_preadvance',  v_remaining_preadvance,
    'driver_earning',        v_driver_earning,
    'fare_amount',           v_trip.fare_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
