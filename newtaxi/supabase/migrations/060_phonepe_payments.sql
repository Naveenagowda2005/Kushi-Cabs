-- ============================================================
-- PAYMENTS & REFUNDS FOR PHONEPE INTEGRATION
-- ============================================================

-- Payment status enum
DROP TYPE IF EXISTS payment_status CASCADE;
CREATE TYPE payment_status AS ENUM (
  'pending',      -- Payment initiated, awaiting PhonePe response
  'completed',    -- Payment successful
  'failed',       -- Payment failed
  'cancelled'     -- Payment cancelled by user
);

-- Refund status enum
DROP TYPE IF EXISTS refund_status CASCADE;
CREATE TYPE refund_status AS ENUM (
  'pending',      -- Refund initiated
  'processing',   -- Refund being processed by PhonePe
  'completed',    -- Refund successful
  'failed'        -- Refund failed
);

-- Payment records - track all driver payments
CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                 UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  driver_id               UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  commission_amount       NUMERIC(12,2) NOT NULL,  -- Amount driver must pay
  
  -- PhonePe integration
  phonepe_merchant_txn_id TEXT UNIQUE,            -- Unique transaction ID
  phonepe_transaction_id  TEXT,                   -- PhonePe's transaction ID
  phonepe_utr             TEXT,                   -- Unique Transaction Reference from PhonePe
  
  status                  payment_status DEFAULT 'pending',
  
  -- Timing for refund calculation
  initiated_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at            TIMESTAMPTZ,
  
  -- Metadata
  payment_method          TEXT DEFAULT 'upi',     -- upi, card, wallet, etc.
  phone_number            TEXT,                   -- Driver's phone for UPI
  
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Refund records - track refunds when driver cancels
CREATE TABLE refunds (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id              UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  trip_id                 UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  driver_id               UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  
  original_payment_amount NUMERIC(12,2) NOT NULL,  -- Original commission paid
  refund_amount           NUMERIC(12,2) NOT NULL,  -- Amount being refunded
  refund_percentage       INTEGER,                 -- 100, 50, 0
  
  -- Cancellation info
  cancelled_at            TIMESTAMPTZ NOT NULL,    -- When driver cancelled
  minutes_from_acceptance NUMERIC(10,2),           -- Minutes between accept and cancel
  
  -- PhonePe refund
  phonepe_refund_id       TEXT UNIQUE,             -- PhonePe refund ID
  status                  refund_status DEFAULT 'pending',
  
  -- Reason for refund
  cancellation_reason     TEXT,                    -- User's cancellation reason
  admin_notes             TEXT,
  
  initiated_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at            TIMESTAMPTZ,
  
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for payment operations
CREATE TABLE payment_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID REFERENCES payments(id) ON DELETE CASCADE,
  refund_id   UUID REFERENCES refunds(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,  -- 'initiated', 'success', 'failed', 'refunded', etc.
  details     JSONB,          -- Additional details like error messages
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add payment tracking to trips table
ALTER TABLE trips ADD COLUMN payment_id UUID REFERENCES payments(id);
ALTER TABLE trips ADD COLUMN refund_id UUID REFERENCES refunds(id);

-- Add commission amount to trips if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'driver_commission'
  ) THEN
    ALTER TABLE trips ADD COLUMN driver_commission NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_payments_driver ON payments(driver_id);
CREATE INDEX idx_payments_trip ON payments(trip_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

CREATE INDEX idx_refunds_driver ON refunds(driver_id);
CREATE INDEX idx_refunds_trip ON refunds(trip_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);

CREATE INDEX idx_audit_payment ON payment_audit_log(payment_id);
CREATE INDEX idx_audit_refund ON payment_audit_log(refund_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Drivers can only see their own payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_drivers_can_view ON payments
  FOR SELECT USING (
    driver_id = auth.uid()
  );

CREATE POLICY payments_drivers_can_insert ON payments
  FOR INSERT WITH CHECK (
    driver_id = auth.uid()
  );

-- Drivers can only see their own refunds
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY refunds_drivers_can_view ON refunds
  FOR SELECT USING (
    driver_id = auth.uid()
  );

-- Admin can see all payments and refunds
CREATE POLICY payments_admins_all ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role_id IN (
        SELECT id FROM roles WHERE name IN ('super_admin', 'admin')
      )
    )
  );

CREATE POLICY refunds_admins_all ON refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role_id IN (
        SELECT id FROM roles WHERE name IN ('super_admin', 'admin')
      )
    )
  );

-- ============================================================
-- HELPER FUNCTION: Calculate refund amount based on cancellation timing
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_refund_percentage(
  p_accepted_at TIMESTAMPTZ,
  p_cancelled_at TIMESTAMPTZ,
  p_scheduled_at TIMESTAMPTZ
)
RETURNS TABLE(refund_percentage INTEGER, minutes_elapsed NUMERIC) AS $$
DECLARE
  v_minutes_from_acceptance NUMERIC;
  v_is_on_scheduled_date BOOLEAN;
BEGIN
  -- Calculate minutes between acceptance and cancellation
  v_minutes_from_acceptance := EXTRACT(EPOCH FROM (p_cancelled_at - p_accepted_at)) / 60.0;
  
  -- Check if cancellation is on the scheduled date
  v_is_on_scheduled_date := (DATE(p_cancelled_at) = DATE(p_scheduled_at));
  
  -- Apply refund rules
  IF v_is_on_scheduled_date THEN
    -- Cancellation on scheduled date = 0% refund
    refund_percentage := 0;
  ELSIF v_minutes_from_acceptance <= 30 THEN
    -- Within 30 mins = 100% refund
    refund_percentage := 100;
  ELSE
    -- After 30 mins = 50% refund
    refund_percentage := 50;
  END IF;
  
  minutes_elapsed := v_minutes_from_acceptance;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER FUNCTION: Process refund automatically
-- ============================================================

CREATE OR REPLACE FUNCTION process_refund_on_trip_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_record RECORD;
  v_refund_percentage INTEGER;
  v_refund_amount NUMERIC;
BEGIN
  -- Only process if trip is being cancelled and it was accepted
  IF NEW.status = 'cancelled' AND OLD.status IN ('accepted', 'started') AND NEW.accepted_at IS NOT NULL THEN
    
    -- Find the payment record
    SELECT * INTO v_payment_record FROM payments 
    WHERE trip_id = NEW.id AND status = 'completed'
    LIMIT 1;
    
    IF v_payment_record IS NOT NULL THEN
      -- Calculate refund percentage
      SELECT refund_percentage INTO v_refund_percentage
      FROM calculate_refund_percentage(NEW.accepted_at, NOW(), NEW.scheduled_at);
      
      -- Calculate refund amount
      v_refund_amount := v_payment_record.commission_amount * (v_refund_percentage::NUMERIC / 100.0);
      
      -- Create refund record if refund amount > 0
      IF v_refund_amount > 0 THEN
        INSERT INTO refunds (
          payment_id,
          trip_id,
          driver_id,
          original_payment_amount,
          refund_amount,
          refund_percentage,
          cancelled_at,
          minutes_from_acceptance,
          status
        ) VALUES (
          v_payment_record.id,
          NEW.id,
          NEW.driver_id,
          v_payment_record.commission_amount,
          v_refund_amount,
          v_refund_percentage,
          NOW(),
          EXTRACT(EPOCH FROM (NOW() - NEW.accepted_at)) / 60.0,
          'pending'
        );
        
        -- Update trip with refund reference
        NEW.refund_id := (SELECT id FROM refunds WHERE payment_id = v_payment_record.id LIMIT 1);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create refund records when trip is cancelled
CREATE TRIGGER trigger_process_refund_on_cancellation
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION process_refund_on_trip_cancellation();
