-- ============================================================
-- TAXI SERVICE MANAGEMENT SYSTEM - Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE  -- 'admin', 'vendor', 'driver'
);

INSERT INTO roles (name) VALUES ('admin'), ('vendor'), ('driver');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone      TEXT UNIQUE NOT NULL,
  full_name  TEXT,
  role_id    INTEGER NOT NULL REFERENCES roles(id),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VENDORS
-- ============================================================
CREATE TABLE vendors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name  TEXT,
  commission_pct NUMERIC(5,2) DEFAULT 10.00,  -- percentage
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE TABLE drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id       UUID REFERENCES vendors(id),
  license_number  TEXT,
  vehicle_number  TEXT,
  is_available    BOOLEAN DEFAULT TRUE,
  current_trip_id UUID,  -- FK added after trips table
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TYPE trip_status AS ENUM (
  'pending',      -- created by admin, waiting for acceptance
  'accepted',     -- accepted by vendor or driver
  'in_progress',  -- driver started the trip
  'completed',    -- trip finished
  'cancelled'
);

CREATE TABLE trips (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by          UUID NOT NULL REFERENCES users(id),       -- admin
  accepted_by         UUID REFERENCES users(id),                -- vendor or driver
  driver_id           UUID REFERENCES drivers(id),
  vendor_id           UUID REFERENCES vendors(id),

  -- Trip details
  pickup_location     TEXT NOT NULL,
  dropoff_location    TEXT NOT NULL,
  pickup_lat          NUMERIC(10,7),
  pickup_lng          NUMERIC(10,7),
  dropoff_lat         NUMERIC(10,7),
  dropoff_lng         NUMERIC(10,7),
  scheduled_at        TIMESTAMPTZ,
  fare_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Status & timing
  status              trip_status DEFAULT 'pending',
  accepted_at         TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  -- Odometer
  start_odometer_url  TEXT,
  end_odometer_url    TEXT,
  start_km            NUMERIC(10,2),
  end_km              NUMERIC(10,2),

  -- Visibility window
  vendor_visible_until TIMESTAMPTZ,  -- created_at + 5 min
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK back to drivers
ALTER TABLE drivers ADD CONSTRAINT fk_current_trip
  FOREIGN KEY (current_trip_id) REFERENCES trips(id);

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE wallets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance    NUMERIC(12,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TYPE transaction_type AS ENUM (
  'credit',   -- money added
  'debit',    -- money deducted
  'commission',
  'withdrawal',
  'refund'
);

CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id   UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  trip_id     UUID REFERENCES trips(id),
  type        transaction_type NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS (odometer images, license, etc.)
-- ============================================================
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id     UUID REFERENCES trips(id),
  doc_type    TEXT NOT NULL,  -- 'start_odometer', 'end_odometer', 'license', etc.
  storage_url TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_vendor ON trips(vendor_id);
CREATE INDEX idx_trips_created_at ON trips(created_at);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_documents_trip ON documents(trip_id);

-- ============================================================
-- TRIGGER: auto-set vendor_visible_until on insert
-- ============================================================
CREATE OR REPLACE FUNCTION set_vendor_visible_until()
RETURNS TRIGGER AS $$
BEGIN
  NEW.vendor_visible_until := NEW.created_at + INTERVAL '5 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_vendor_visible_until
  BEFORE INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION set_vendor_visible_until();

-- ============================================================
-- TRIGGER: auto-create wallet on user insert
-- ============================================================
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_wallet
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_user();
