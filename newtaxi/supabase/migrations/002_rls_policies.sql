-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents    ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role name
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT r.name FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE u.id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- USERS policies
-- ============================================================
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- TRIPS policies
-- ============================================================

-- Admins see all trips
CREATE POLICY "Admin full access to trips"
  ON trips FOR ALL USING (get_my_role() = 'admin');

-- Vendors see pending trips within 5-min window OR their own accepted trips
CREATE POLICY "Vendors see available and own trips"
  ON trips FOR SELECT USING (
    get_my_role() = 'vendor' AND (
      (status = 'pending' AND NOW() <= vendor_visible_until)
      OR vendor_id = (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- Drivers see pending trips after 5-min window OR their own trips
CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    get_my_role() = 'driver' AND (
      (status = 'pending' AND NOW() > vendor_visible_until)
      OR driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

-- Vendors can update trips they accepted
CREATE POLICY "Vendors update own trips"
  ON trips FOR UPDATE USING (
    get_my_role() = 'vendor'
    AND vendor_id = (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Drivers can update trips assigned to them
CREATE POLICY "Drivers update own trips"
  ON trips FOR UPDATE USING (
    get_my_role() = 'driver'
    AND driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- ============================================================
-- WALLETS policies
-- ============================================================
CREATE POLICY "Users see own wallet"
  ON wallets FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin sees all wallets"
  ON wallets FOR SELECT USING (get_my_role() = 'admin');

-- ============================================================
-- TRANSACTIONS policies
-- ============================================================
CREATE POLICY "Users see own transactions"
  ON transactions FOR SELECT USING (
    wallet_id = (SELECT id FROM wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin sees all transactions"
  ON transactions FOR SELECT USING (get_my_role() = 'admin');

-- ============================================================
-- DOCUMENTS policies
-- ============================================================
CREATE POLICY "Users see own documents"
  ON documents FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users insert own documents"
  ON documents FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin sees all documents"
  ON documents FOR SELECT USING (get_my_role() = 'admin');
