-- ============================================================
-- ALL FUNCTIONS & STORAGE POLICIES (replaces 004, 005, 006)
-- Run this after 001, 002, 003
-- ============================================================

-- ============================================================
-- 1. WALLET BALANCE INCREMENT
-- ============================================================
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE wallets
  SET balance    = balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. COMPLETE TRIP (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION complete_trip(
  p_trip_id          UUID,
  p_user_id          UUID,
  p_end_odometer_url TEXT,
  p_end_km           NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_trip   trips%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  IF v_trip.status <> 'in_progress' THEN
    RETURN json_build_object('success', false, 'error', 'Trip is not in progress');
  END IF;

  UPDATE trips SET
    status           = 'completed',
    completed_at     = NOW(),
    end_odometer_url = p_end_odometer_url,
    end_km           = p_end_km
  WHERE id = p_trip_id;

  UPDATE drivers SET
    is_available    = TRUE,
    current_trip_id = NULL
  WHERE user_id = p_user_id;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;

  UPDATE wallets SET
    balance    = balance + v_trip.fare_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO transactions (wallet_id, trip_id, type, amount, description)
  VALUES (v_wallet.id, p_trip_id, 'credit', v_trip.fare_amount, 'Trip earnings');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. WITHDRAWAL (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION request_withdrawal(
  p_user_id UUID,
  p_amount  NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be greater than zero');
  END IF;

  IF v_wallet.balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Insufficient balance. Available: ₹%s', v_wallet.balance)
    );
  END IF;

  UPDATE wallets SET
    balance    = balance - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO transactions (wallet_id, type, amount, description)
  VALUES (v_wallet.id, 'withdrawal', p_amount, 'Withdrawal request');

  RETURN json_build_object('success', true, 'new_balance', v_wallet.balance - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. DEDUCT COMMISSION (vendor) - Uses global app_settings
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

-- ============================================================
-- 5. STORAGE POLICIES (odometer-images + documents buckets)
-- Create both buckets in Supabase dashboard first
-- ============================================================
CREATE POLICY "Authenticated users can upload odometer images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'odometer-images');

CREATE POLICY "Authenticated users can read odometer images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'odometer-images');

CREATE POLICY "Users can update own odometer images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'odometer-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- ============================================================
-- 6. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- ============================================================
-- 7. PUSH TOKEN COLUMN
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
