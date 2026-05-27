-- ============================================================
-- ADD PAYMENT GATEWAY SUPPORT TO PAYMENT ORDERS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE payment_gateway AS ENUM ('razorpay', 'phonepe');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS gateway payment_gateway DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS phonepe_order_id TEXT,
  ADD COLUMN IF NOT EXISTS phonepe_payment_id TEXT;
