-- ============================================================
-- DRIVER DOCUMENT VERIFICATION SYSTEM
-- Migration: 037_driver_documents_verification.sql
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

-- Document types enum
CREATE TYPE driver_document_type AS ENUM (
  'DL',              -- Driver's License
  'VEHICLE_FRONT',   -- Vehicle Front Photo
  'INSURANCE',       -- Insurance Certificate
  'FC',              -- Fitness Certificate
  'EMISSION',        -- Emission Certificate
  'RC'               -- Registration Certificate
);

-- Verification status enum
CREATE TYPE verification_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- ============================================================
-- DRIVER_DOCUMENTS TABLE
-- ============================================================
-- Stores individual driver documents with their verification status
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Document details
  document_type driver_document_type NOT NULL,
  document_data BYTEA NOT NULL,  -- Binary data for the document
  document_name TEXT,  -- Original file name
  document_mime_type TEXT DEFAULT 'image/jpeg',  -- MIME type
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verification
  status verification_status DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- super admin who verified
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: one document per driver per type
  UNIQUE(driver_id, document_type)
);

-- ============================================================
-- DRIVER_VERIFICATION_STATUS TABLE
-- ============================================================
-- Tracks overall verification status for each driver
CREATE TABLE driver_verification_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  driver_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Overall status
  overall_status verification_status DEFAULT 'pending',
  
  -- Submission tracking
  all_documents_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  
  -- Approval/Rejection tracking
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Driver documents indexes
CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON driver_documents(status);
CREATE INDEX idx_driver_documents_document_type ON driver_documents(document_type);
CREATE INDEX idx_driver_documents_verified_by ON driver_documents(verified_by);
CREATE INDEX idx_driver_documents_uploaded_at ON driver_documents(uploaded_at);
CREATE INDEX idx_driver_documents_driver_type ON driver_documents(driver_id, document_type);

-- Driver verification status indexes
CREATE INDEX idx_driver_verification_status_driver_id ON driver_verification_status(driver_id);
CREATE INDEX idx_driver_verification_status_overall_status ON driver_verification_status(overall_status);
CREATE INDEX idx_driver_verification_status_submitted_at ON driver_verification_status(submitted_at);
CREATE INDEX idx_driver_verification_status_approved_at ON driver_verification_status(approved_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Update updated_at on driver_documents
CREATE OR REPLACE FUNCTION update_driver_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_driver_documents_updated_at
  BEFORE UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_driver_documents_timestamp();

-- Trigger: Update updated_at on driver_verification_status
CREATE OR REPLACE FUNCTION update_driver_verification_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_driver_verification_status_updated_at
  BEFORE UPDATE ON driver_verification_status
  FOR EACH ROW EXECUTE FUNCTION update_driver_verification_status_timestamp();

-- Trigger: Auto-create verification status record when driver document is uploaded
CREATE OR REPLACE FUNCTION create_verification_status_for_driver()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO driver_verification_status (driver_id)
  VALUES (NEW.driver_id)
  ON CONFLICT (driver_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_verification_status
  AFTER INSERT ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION create_verification_status_for_driver();

-- Trigger: Update verification status when all documents are submitted
CREATE OR REPLACE FUNCTION check_all_documents_submitted()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;  -- DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC
  submitted_count INTEGER;
BEGIN
  -- Count submitted documents for this driver
  SELECT COUNT(DISTINCT document_type) INTO submitted_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
  -- Update the verification status
  UPDATE driver_verification_status
  SET all_documents_submitted = (submitted_count >= total_required),
      submitted_at = CASE 
        WHEN submitted_count >= total_required AND submitted_at IS NULL 
        THEN NOW() 
        ELSE submitted_at 
      END
  WHERE driver_id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_all_documents_submitted
  AFTER INSERT OR UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION check_all_documents_submitted();

-- Trigger: Update overall verification status based on document statuses
CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
BEGIN
  -- Count documents by status
  SELECT 
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'approved'),
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'rejected'),
    COUNT(DISTINCT document_type)
  INTO approved_count, rejected_count, submitted_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
  -- Determine new status
  IF rejected_count > 0 THEN
    new_status := 'rejected'::verification_status;
  ELSIF approved_count = total_required THEN
    new_status := 'approved'::verification_status;
  ELSE
    new_status := 'pending'::verification_status;
  END IF;
  
  -- Update verification status
  UPDATE driver_verification_status
  SET overall_status = new_status,
      approved_at = CASE WHEN new_status = 'approved' AND approved_at IS NULL THEN NOW() ELSE approved_at END,
      rejected_at = CASE WHEN new_status = 'rejected' AND rejected_at IS NULL THEN NOW() ELSE rejected_at END
  WHERE driver_id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_overall_verification_status
  AFTER INSERT OR UPDATE ON driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_overall_verification_status();

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE driver_documents IS 'Stores individual driver documents (license, insurance, etc.) with verification status';
COMMENT ON TABLE driver_verification_status IS 'Tracks overall verification status for each driver across all required documents';
COMMENT ON COLUMN driver_documents.document_type IS 'Type of document: DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC';
COMMENT ON COLUMN driver_documents.status IS 'Verification status: pending, approved, rejected';
COMMENT ON COLUMN driver_documents.verified_by IS 'UUID of super admin who verified this document';
COMMENT ON COLUMN driver_verification_status.all_documents_submitted IS 'True when all 6 required documents have been uploaded';
COMMENT ON COLUMN driver_verification_status.overall_status IS 'Overall verification status: pending, approved, rejected';
