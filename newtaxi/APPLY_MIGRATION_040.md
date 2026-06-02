# Apply Migration 040 - Fix Document Data Type

## Problem
The database schema defines `document_data` as `BYTEA` (binary), but we're storing base64 strings (TEXT). This causes type mismatch issues.

## Solution
Change `document_data` column from `BYTEA` to `TEXT` to properly store base64 strings.

## How to Apply

### Option 1: Using Supabase CLI (Recommended)
```bash
cd newtaxi
supabase db push
```

This will automatically apply migration 040.

### Option 2: Manual SQL in Supabase Dashboard

1. Go to **Supabase Dashboard**
2. Click **"SQL Editor"**
3. Create new query
4. Copy and paste the SQL below:

```sql
-- Drop dependent triggers and functions first
DROP TRIGGER IF EXISTS trg_update_overall_verification_status ON driver_documents;
DROP FUNCTION IF EXISTS update_overall_verification_status();

DROP TRIGGER IF EXISTS trg_check_all_documents_submitted ON driver_documents;
DROP FUNCTION IF EXISTS check_all_documents_submitted();

DROP TRIGGER IF EXISTS trg_create_verification_status ON driver_documents;
DROP FUNCTION IF EXISTS create_verification_status_for_driver();

-- Alter the column type
ALTER TABLE driver_documents
ALTER COLUMN document_data TYPE TEXT;

-- Recreate the functions and triggers

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

5. Click **"Run"**
6. Wait for success message

## Verification

After applying the migration, verify it worked:

```sql
-- Check column type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'driver_documents' AND column_name = 'document_data';
```

Should show: `document_data | text`

## After Migration

1. **Restart App**
   - Stop Expo: Ctrl+C
   - Clear cache: `npx expo start --clear`

2. **Test Upload**
   - Sign up as driver
   - Upload a document
   - Should now work without type errors

3. **Verify Database**
   - Check Supabase dashboard
   - Document should be stored

## Troubleshooting

### If Migration Fails

**Error: "Cannot drop function"**
- Some triggers might not exist
- This is OK, continue with the migration

**Error: "Column type conversion failed"**
- Check if there's existing data
- The migration should handle it automatically

**Error: "Trigger already exists"**
- Drop the trigger first, then recreate

### If Upload Still Fails

1. Check console logs
2. Verify migration was applied
3. Restart app with cache clear
4. Try uploading again

## Files

- **Migration**: `supabase/migrations/040_fix_document_data_type.sql`
- **Service**: `src/services/documentService.js` (already updated to use upsert)

## Status

✅ Migration file created
⏳ Waiting for migration to be applied
⏳ Testing after migration

---

**Next Step**: Apply migration 040 using Supabase CLI or manual SQL
