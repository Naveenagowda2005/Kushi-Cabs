-- Fix wallet auto-creation trigger to bypass RLS
-- The trigger function needs SECURITY DEFINER to insert into wallets

CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add an explicit insert policy as fallback
CREATE POLICY "System can insert wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
