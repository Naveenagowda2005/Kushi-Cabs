-- 🔴 RUN THIS IN SUPABASE SQL EDITOR RIGHT NOW
-- Copy everything below and paste into Supabase SQL Editor
-- Then click RUN

CREATE TYPE vendor_document_type AS ENUM ('AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE');

CREATE TABLE vendor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  documents JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_verification_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_status TEXT DEFAULT 'not_started' CHECK (overall_status IN ('not_started', 'pending', 'approved', 'rejected')),
  all_documents_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_user_id ON vendor_documents(user_id);
CREATE INDEX idx_vendor_verification_status_vendor_id ON vendor_verification_status(vendor_id);
CREATE INDEX idx_vendor_verification_status_user_id ON vendor_verification_status(user_id);
CREATE INDEX idx_vendor_verification_status_overall_status ON vendor_verification_status(overall_status);

CREATE OR REPLACE FUNCTION sync_vendor_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET verification_status = CASE 
    WHEN NEW.overall_status = 'approved' THEN 'approved'
    WHEN NEW.overall_status = 'rejected' THEN 'rejected'
    WHEN NEW.all_documents_submitted THEN 'pending'
    ELSE 'not_started'
  END
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_vendor_verification_status
  AFTER INSERT OR UPDATE ON vendor_verification_status
  FOR EACH ROW EXECUTE FUNCTION sync_vendor_verification_status();

COMMENT ON TABLE vendor_documents IS 'Stores vendor verification documents (Aadhar, PAN, Bank Passbook, Selfie)';
COMMENT ON TABLE vendor_verification_status IS 'Tracks overall vendor verification and approval status';
COMMENT ON COLUMN vendor_verification_status.overall_status IS 'Vendor verification status: not_started, pending, approved, rejected';
