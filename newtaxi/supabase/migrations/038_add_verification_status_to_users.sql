-- ============================================================
-- ADD VERIFICATION STATUS TO USERS TABLE
-- Migration: 038_add_verification_status_to_users.sql
-- ============================================================

-- ============================================================
-- ALTER USERS TABLE
-- ============================================================

-- Add verification_status column to users table
ALTER TABLE users
ADD COLUMN verification_status TEXT DEFAULT 'not_started'
CHECK (verification_status IN ('not_started', 'pending', 'approved', 'rejected'));

-- ============================================================
-- INDEXES
-- ============================================================

-- Index for filtering users by verification status
CREATE INDEX idx_users_verification_status ON users(verification_status);

-- ============================================================
-- TRIGGER
-- ============================================================

-- Trigger: Sync verification_status from driver_verification_status to users table
CREATE OR REPLACE FUNCTION sync_user_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET verification_status = CASE 
    WHEN NEW.overall_status = 'approved' THEN 'approved'
    WHEN NEW.overall_status = 'rejected' THEN 'rejected'
    WHEN NEW.all_documents_submitted THEN 'pending'
    ELSE 'not_started'
  END
  WHERE id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_user_verification_status
  AFTER INSERT OR UPDATE ON driver_verification_status
  FOR EACH ROW EXECUTE FUNCTION sync_user_verification_status();

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON COLUMN users.verification_status IS 'Driver verification status: not_started, pending, approved, rejected';
