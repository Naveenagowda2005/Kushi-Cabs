-- ============================================================
-- APPLY PHONEPE WALLET TABLES MIGRATION
-- Run this in Supabase SQL editor to set up PhonePe wallet system
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

-- Create indexes
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

-- Enable RLS
ALTER TABLE phonepe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonepe_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phonepe_transactions
DROP POLICY IF EXISTS phonepe_transactions_users_view ON phonepe_transactions;
CREATE POLICY phonepe_transactions_users_view ON phonepe_transactions
  FOR SELECT USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS phonepe_transactions_admins_all ON phonepe_transactions;
CREATE POLICY phonepe_transactions_admins_all ON phonepe_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.verification_status IN ('approved', 'super_admin')
    )
  );

-- Create RLS policies for phonepe_webhook_logs (admin only)
DROP POLICY IF EXISTS phonepe_webhook_logs_disable_select ON phonepe_webhook_logs;
CREATE POLICY phonepe_webhook_logs_disable_select ON phonepe_webhook_logs
  FOR SELECT USING (false);

-- Create function to update wallet on successful payment
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
    
    RAISE LOG 'Wallet credited for user %: ₹%', NEW.user_id, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_phonepe_wallet_update ON phonepe_transactions;
CREATE TRIGGER trigger_phonepe_wallet_update
  AFTER UPDATE ON phonepe_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_on_phonepe_success();

-- Verify tables created
SELECT 
  'phonepe_transactions' as table_name,
  COUNT(*) as row_count
FROM phonepe_transactions
UNION ALL
SELECT 
  'phonepe_webhook_logs' as table_name,
  COUNT(*) as row_count
FROM phonepe_webhook_logs;
