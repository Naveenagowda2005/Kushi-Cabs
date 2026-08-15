-- ============================================================
-- PHONEPE WALLET RECHARGE INTEGRATION
-- ============================================================
-- Tables for tracking PhonePe wallet recharge transactions
-- This is separate from trip-based payments (migration 060)
-- ============================================================

-- Create phonepe_transactions table
CREATE TABLE IF NOT EXISTS phonepe_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type               TEXT NOT NULL,  -- 'driver', 'vendor', 'super_admin'
  amount                  NUMERIC(12,2) NOT NULL,  -- Amount in rupees
  
  -- PhonePe transaction tracking
  merchant_transaction_id TEXT UNIQUE NOT NULL,    -- Unique transaction ID we generate
  phonepe_transaction_id  TEXT,                    -- PhonePe's transaction ID
  
  -- Payment status
  status                  TEXT DEFAULT 'INITIATED',  -- INITIATED, SUCCESS, FAILED, PENDING
  failure_code            TEXT,                      -- Error code if payment failed
  
  -- Timestamps
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  verified_at             TIMESTAMPTZ,
  
  -- Additional metadata
  payment_method          TEXT DEFAULT 'UPI',
  notes                   TEXT
);

-- Create phonepe_webhook_logs table for audit trail
CREATE TABLE IF NOT EXISTS phonepe_webhook_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id          TEXT NOT NULL,           -- Merchant transaction ID
  status                  TEXT NOT NULL,            -- Payment status from webhook
  code                    TEXT,                     -- Status code from PhonePe
  payload                 JSONB NOT NULL,          -- Full webhook payload for debugging
  received_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_phonepe_transactions_user 
  ON phonepe_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_phonepe_transactions_status 
  ON phonepe_transactions(status);

CREATE INDEX IF NOT EXISTS idx_phonepe_transactions_merchant_id 
  ON phonepe_transactions(merchant_transaction_id);

CREATE INDEX IF NOT EXISTS idx_phonepe_transactions_created 
  ON phonepe_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phonepe_webhook_logs_transaction 
  ON phonepe_webhook_logs(transaction_id);

CREATE INDEX IF NOT EXISTS idx_phonepe_webhook_logs_received 
  ON phonepe_webhook_logs(received_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Users can only see their own transactions
ALTER TABLE phonepe_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phonepe_transactions_users_view ON phonepe_transactions;
CREATE POLICY phonepe_transactions_users_view ON phonepe_transactions
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Admins can see all transactions
DROP POLICY IF EXISTS phonepe_transactions_admins_all ON phonepe_transactions;
CREATE POLICY phonepe_transactions_admins_all ON phonepe_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.verification_status IN ('approved', 'super_admin')
    )
  );

-- Service role (backend) should bypass RLS for this table
-- This is handled via SUPABASE_SERVICE_ROLE_KEY in the backend

-- Webhook logs are admin only
ALTER TABLE phonepe_webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phonepe_webhook_logs_disable_select ON phonepe_webhook_logs;
CREATE POLICY phonepe_webhook_logs_disable_select ON phonepe_webhook_logs
  FOR SELECT USING (false);

-- ============================================================
-- TRIGGER TO UPDATE WALLET ON SUCCESSFUL PAYMENT
-- ============================================================

CREATE OR REPLACE FUNCTION update_wallet_on_phonepe_success()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_transaction_id UUID;
BEGIN
  -- Only process if status changed to SUCCESS
  IF NEW.status = 'SUCCESS' AND OLD.status != 'SUCCESS' THEN
    -- Insert wallet transaction (credit)
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
    
    -- Log the wallet transaction
    INSERT INTO transaction_log (
      user_id,
      transaction_type,
      amount,
      description,
      reference_id
    ) VALUES (
      NEW.user_id,
      'wallet_credit',
      NEW.amount,
      'PhonePe wallet recharge',
      v_wallet_transaction_id::TEXT
    );
    
    RAISE LOG 'Wallet credited for user %: ₹%', NEW.user_id, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_phonepe_wallet_update ON phonepe_transactions;

-- Create trigger
CREATE TRIGGER trigger_phonepe_wallet_update
  AFTER UPDATE ON phonepe_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_on_phonepe_success();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE phonepe_transactions IS 'Tracks PhonePe wallet recharge transactions initiated by users';
COMMENT ON TABLE phonepe_webhook_logs IS 'Audit trail of PhonePe webhook notifications received';

COMMENT ON COLUMN phonepe_transactions.merchant_transaction_id IS 'Unique ID we generate for tracking (should be stored client-side too)';
COMMENT ON COLUMN phonepe_transactions.phonepe_transaction_id IS 'ID returned by PhonePe in the webhook';
COMMENT ON COLUMN phonepe_transactions.status IS 'INITIATED (transaction started), SUCCESS (payment received), FAILED (payment declined), PENDING (awaiting PhonePe response)';
