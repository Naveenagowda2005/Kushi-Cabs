-- ============================================================
-- PAYMENT ORDERS (Razorpay integration)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('deposit', 'withdrawal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payment_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  type                payment_type NOT NULL,
  amount              NUMERIC(12,2) NOT NULL,
  status              payment_status DEFAULT 'pending',
  bank_account        TEXT,
  ifsc_code           TEXT,
  upi_id              TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own payment orders"   ON payment_orders;
DROP POLICY IF EXISTS "Users can insert own payment orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can update own payment orders" ON payment_orders;

CREATE POLICY "Users can read own payment orders"
  ON payment_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment orders"
  ON payment_orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment orders"
  ON payment_orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- VERIFY AND CREDIT DEPOSIT
-- ============================================================
CREATE OR REPLACE FUNCTION verify_and_credit_deposit(
  p_user_id    UUID,
  p_order_id   TEXT,
  p_payment_id TEXT,
  p_amount     NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
BEGIN
  UPDATE payment_orders SET
    status              = 'completed',
    razorpay_payment_id = p_payment_id,
    updated_at          = NOW()
  WHERE razorpay_order_id = p_order_id AND user_id = p_user_id;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  UPDATE wallets SET
    balance    = balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO transactions (wallet_id, type, amount, description)
  VALUES (v_wallet.id, 'credit', p_amount, 'Wallet deposit via Razorpay');

  RETURN json_build_object('success', true, 'new_balance', v_wallet.balance + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
