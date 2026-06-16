-- ============================================================
-- FIX PAYMENT ORDERS RLS - Allow user deposits
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own payment orders"   ON payment_orders;
DROP POLICY IF EXISTS "Users can insert own payment orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can update own payment orders" ON payment_orders;

-- Create RPC function to insert payment order (bypasses RLS)
CREATE OR REPLACE FUNCTION insert_payment_order(
  p_user_id UUID,
  p_type payment_type,
  p_amount NUMERIC,
  p_gateway TEXT DEFAULT 'phonepe',
  p_phonepe_order_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  INSERT INTO payment_orders (user_id, type, amount, status, gateway, phonepe_order_id)
  VALUES (p_user_id, p_type, p_amount, 'pending'::payment_status, p_gateway, p_phonepe_order_id)
  RETURNING id INTO v_order_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate RLS policies
CREATE POLICY "Users can read own payment orders"
  ON payment_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own payment orders"
  ON payment_orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Allow system to insert (for deposits via app)
CREATE POLICY "Authenticated users can trigger deposit"
  ON payment_orders FOR INSERT TO authenticated
  WITH CHECK (true);

