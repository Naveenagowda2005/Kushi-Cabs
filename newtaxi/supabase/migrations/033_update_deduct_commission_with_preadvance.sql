-- ============================================================
-- UPDATE DEDUCT_COMMISSION FUNCTION TO INCLUDE CUSTOMER PRE-ADVANCE
-- Commission to pay by driver = Commission - Customer Pre-Advance (minimum 0)
-- Driver earning = Fare - Commission (always deducted from fare)
-- Remaining pre-advance goes to vendor (not charged to driver)
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
  v_driver_earning NUMERIC;
  v_customer_preadvance NUMERIC;
  v_commission_to_pay NUMERIC;
  v_remaining_preadvance NUMERIC;
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

  -- Get customer pre-advance (default to 0 if not set)
  v_customer_preadvance := COALESCE(v_trip.customer_pre_advance, 0);

  -- Calculate commission to pay by driver: Commission - Customer Pre-Advance (minimum 0)
  v_commission_to_pay := GREATEST(0, v_commission - v_customer_preadvance);
  
  -- Calculate remaining pre-advance: Customer Pre-Advance - Commission (minimum 0)
  v_remaining_preadvance := GREATEST(0, v_customer_preadvance - v_commission);

  -- Driver earning = Fare - Commission (commission is always deducted from fare)
  v_driver_earning := v_trip.fare_amount - v_commission;

  -- Update driver wallet with driver earning
  UPDATE wallets SET
    balance    = balance + v_driver_earning,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Insert transaction record for driver earning
  INSERT INTO transactions (wallet_id, trip_id, type, amount, description)
  VALUES (
    v_wallet.id, p_trip_id, 'credit',
    v_driver_earning,
    format('Trip earning (Fare: ₹%s - Commission: ₹%s)', v_trip.fare_amount, v_commission)
  );

  -- Add commission to vendor wallet
  UPDATE wallets SET
    balance    = balance + v_commission,
    updated_at = NOW()
  WHERE user_id = v_trip.created_by;

  -- Insert transaction record for vendor commission
  INSERT INTO transactions (wallet_id, trip_id, type, amount, description)
  VALUES (
    (SELECT id FROM wallets WHERE user_id = v_trip.created_by),
    p_trip_id, 'commission',
    v_commission,
    format('Commission %s%% on trip', v_commission_value)
  );

  RETURN json_build_object(
    'success', true, 
    'commission', v_commission,
    'commission_to_pay', v_commission_to_pay,
    'commission_type', v_commission_type, 
    'commission_value', v_commission_value,
    'customer_preadvance', v_customer_preadvance,
    'remaining_preadvance', v_remaining_preadvance,
    'driver_earning', v_driver_earning,
    'fare_amount', v_trip.fare_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
