-- ============================================================
-- PHONEPE WALLET TABLES - EXECUTE IN SUPABASE SQL EDITOR NOW
-- ============================================================

-- 1. Create phonepe_transactions table
CREATE TABLE phonepe_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type               TEXT NOT NULL,
  amount                  NUMERIC(12,2) NOT NULL,
  merchant_transaction_id TEXT UNIQUE NOT NULL,
  phonepe_transaction_id  TEXT,
  status                  TEXT DEFAULT 'INITIATED',
  failure_code            TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  verified_at             TIMESTAMPTZ,
  payment_method          TEXT DEFAULT 'UPI',
  notes                   TEXT
);

-- 2. Create phonepe_webhook_logs table
CREATE TABLE phonepe_webhook_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id          TEXT NOT NULL,
  status                  TEXT NOT NULL,
  code                    TEXT,
  payload                 JSONB NOT NULL,
  received_at             TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_phonepe_transactions_user ON phonepe_transactions(user_id);
CREATE INDEX idx_phonepe_transactions_status ON phonepe_transactions(status);
CREATE INDEX idx_phonepe_transactions_merchant_id ON phonepe_transactions(merchant_transaction_id);
CREATE INDEX idx_phonepe_transactions_created ON phonepe_transactions(created_at DESC);
CREATE INDEX idx_phonepe_webhook_logs_transaction ON phonepe_webhook_logs(transaction_id);
CREATE INDEX idx_phonepe_webhook_logs_received ON phonepe_webhook_logs(received_at DESC);

-- 4. Enable RLS
ALTER TABLE phonepe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonepe_webhook_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY phonepe_transactions_users_view ON phonepe_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY phonepe_transactions_admins_all ON phonepe_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.verification_status IN ('approved', 'super_admin')
    )
  );

CREATE POLICY phonepe_webhook_logs_disable_select ON phonepe_webhook_logs
  FOR SELECT USING (false);

-- 6. Create wallet update function
CREATE OR REPLACE FUNCTION update_wallet_on_phonepe_success()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_transaction_id UUID;
BEGIN
  IF NEW.status = 'SUCCESS' AND OLD.status != 'SUCCESS' THEN
    INSERT INTO wallet_transactions (
      user_id,
      type,
      amount,
      description,
      payment_gateway,
      external_reference_id,
      created_at
    ) VALUES (
      NEW.user_id,
      'credit',
      NEW.amount,
      'Wallet recharge via PhonePe',
      'phonepe',
      NEW.merchant_transaction_id,
      NOW()
    )
    RETURNING id INTO v_wallet_transaction_id;
    
    RAISE LOG 'Wallet credited for user %: Amount: %', NEW.user_id, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger
CREATE TRIGGER trigger_phonepe_wallet_update
  AFTER UPDATE ON phonepe_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_on_phonepe_success();

-- Done! Tables are ready.
