-- ============================================================
-- OTP VERIFICATION TABLE - For persistent OTP storage
-- ============================================================

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS otp_verification (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number      TEXT UNIQUE NOT NULL,
  otp_code          TEXT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  verified          BOOLEAN DEFAULT FALSE,
  verification_attempts INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone number lookup
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verification(expires_at);

-- Auto cleanup - delete expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verification
  WHERE expires_at < NOW()
  OR (verified = true AND updated_at < NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Run cleanup daily
CREATE OR REPLACE FUNCTION schedule_otp_cleanup()
RETURNS void AS $$
BEGIN
  -- Note: Supabase doesn't support cron jobs natively
  -- Cleanup will happen on-demand when OTP is verified
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for OTP table (backend only, no frontend access)
ALTER TABLE otp_verification DISABLE ROW LEVEL SECURITY;
