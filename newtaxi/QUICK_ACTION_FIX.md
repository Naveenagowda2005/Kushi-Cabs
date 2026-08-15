# Quick Action - Fix Document Storage (5 minutes)

## Problem
Documents not storing. Error: `duplicate key value violates unique constraint`

## Root Cause
Database column `document_data` is `BYTEA` but we're storing base64 strings (TEXT)

## Quick Fix

### Step 1: Apply Migration (2 minutes)

**Using Supabase CLI**:
```bash
cd newtaxi
supabase db push
```

**Or manually**:
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Create new query
4. Copy this SQL:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;
DROP FUNCTION IF EXISTS update_overall_verification_status();
DROP TRIGGER IF EXISTS trg_check_all_documents_submitted ON driver_documents;
DROP FUNCTION IF EXISTS check_all_documents_submitted();
DROP TRIGGER IF EXISTS trg_create_verification_status ON driver_documents;
DROP FUNCTION IF EXISTS create_verification_status_for_driver();

-- Change column type
ALTER TABLE driver_documents ALTER COLUMN document_data TYPE TEXT;

-- Recreate functions and triggers
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

CREATE OR REPLACE FUNCTION check_all_documents_submitted()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT document_type) INTO submitted_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
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

CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
BEGIN
  SELECT 
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'approved'),
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'rejected'),
    COUNT(DISTINCT document_type)
  INTO approved_count, rejected_count, submitted_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
  IF rejected_count > 0 THEN
    new_status := 'rejected'::verification_status;
  ELSIF approved_count = total_required THEN
    new_status := 'approved'::verification_status;
  ELSE
    new_status := 'pending'::verification_status;
  END IF;
  
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
```

5. Click "Run"
6. Wait for success

### Step 2: Restart App (1 minute)

```bash
# Stop Expo (Ctrl+C)
# Then run:
npx expo start --clear
```

### Step 3: Test Upload (2 minutes)

1. Sign up as driver
2. Upload a document
3. Should see success alert
4. Check Supabase - document should be there

## Verification

### Check Column Type
```sql
SELECT data_type FROM information_schema.columns
WHERE table_name = 'driver_documents' AND column_name = 'document_data';
```

Should show: `text`

### Check Upload Works
Console should show:
```
uploadDocumentImage: Successfully uploaded DL
```

### Check Database
Supabase `driver_documents` table should have new row with base64 data

## Done! ✅

If upload works now, continue with testing all 6 documents.

---

**Total Time**: 5 minutes
**Status**: Ready to apply
