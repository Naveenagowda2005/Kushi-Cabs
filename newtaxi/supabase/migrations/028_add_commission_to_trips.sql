-- ============================================================
-- ADD COMMISSION COLUMNS TO TRIPS TABLE
-- Store commission amount at trip completion time
-- ============================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false;

-- ============================================================
-- UPDATE DEDUCT_COMMISSION FUNCTION
-- Now stores commission_amount in trips table
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_commission(
  p_trip_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_trip       trips%ROWTYPE;
  v_wallet     wallets%ROWTYPE;
  v_commission NUMERIC;
  v_commission_type TEXT;
  v_commission_value NUMERIC;
BEGIN
  -- Fetch trip
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  -- Fetch wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found for user: ' || p_user_id::text);
  END IF;

  -- Fetch commission settings from app_settings
  SELECT vendor_commission_type, vendor_commission_value 
  INTO v_commission_type, v_commission_value
  FROM app_settings 
  WHERE id = 'global';

  -- Check if commission settings exist
  IF v_commission_type IS NULL OR v_commission_value IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commission settings not found in app_settings');
  END IF;

  -- Calculate commission based on type
  IF v_commission_type = 'percentage' THEN
    v_commission := (v_trip.fare_amount * v_commission_value) / 100;
  ELSE
    v_commission := v_commission_value;  -- Fixed amount
  END IF;

  -- Update wallet
  UPDATE wallets SET
    balance    = balance + v_commission,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Store commission amount in trips table (for historical record)
  UPDATE trips SET
    commission_amount = v_commission,
    commission_paid = true
  WHERE id = p_trip_id;

  -- Insert transaction record
  INSERT INTO transactions (wallet_id, trip_id, type, amount, description)
  VALUES (
    v_wallet.id, p_trip_id, 'commission',
    v_commission,
    format('Commission %s%% on trip', v_commission_value)
  );

  RETURN json_build_object('success', true, 'commission', v_commission, 'commission_type', v_commission_type, 'commission_value', v_commission_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
