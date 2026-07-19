# CRITICAL NEXT STEPS - Driver Re-Upload Fix

## STATUS
✅ Backend: Running on http://192.168.1.114:4000
✅ Supabase credentials: Loaded successfully
⏳ Database Migration 106: **NEEDS TO BE APPLIED**

---

## STEP 1: Apply Migration 106 to Supabase Database

**Go to Supabase Console:**
1. Open https://app.supabase.com
2. Select your project: `cqfsirfjwfxvwggjkrvd`
3. Click **SQL Editor** in left sidebar
4. Click **+ New Query**
5. Paste the SQL below (from file: `newtaxi/APPLY_MIGRATION_106.sql`)
6. Click **Run**

### SQL to Execute:

```sql
-- ============================================================
-- APPLY MIGRATION 106: DISABLE TRIGGER FOR APPROVED DRIVERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
  current_status verification_status;
BEGIN
  -- Get current verification status
  SELECT overall_status INTO current_status
  FROM driver_verification_status
  WHERE driver_id = NEW.driver_id;

  -- CRITICAL: If driver is already approved, DO NOT change status
  -- This allows approved drivers to re-upload without losing access
  IF current_status = 'approved'::verification_status THEN
    RETURN NEW;
  END IF;

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

SELECT 'Migration 106 applied successfully' as status;
```

---

## STEP 2: Test the Fix

After migration is applied:

1. **Approve a driver** in the admin dashboard (use driver ID: `a3c7433b-e2d9-4963-b378-30d3996e23af` if still available)

2. **Driver re-uploads documents** via the app

3. **Verify database state:**
   - Overall status should stay `'approved'` ✓
   - `is_re_verification` should be `true`
   - Driver can still access dashboard ✓

---

## FILES MODIFIED

✅ `backend/index.js` - Fixed dotenv loading with explicit path
✅ `backend/routes/document-upload.js` - Added debug logging for credentials
✅ Backend now running on correct IP: `192.168.1.114:4000`

---

## CURRENT STATE

**Backend Ready:**
```
✅ Taxi SMS backend listening on http://192.168.1.114:4000
✅ Supabase Admin client initialized
✅ Document upload router loaded
✅ All credentials loaded successfully
🟢 SERVICE READY FOR REQUESTS
```

**What's NOT done yet:**
- Migration 106 not yet applied to database
- Frontend app needs to be running to test

---

## BLOCKING ISSUE RESOLVED

Previously: "Backend returned error: 500 Supabase credentials missing"
Now: ✅ Credentials are loading correctly

The key fix was ensuring dotenv loads from the correct path in backend/index.js before any routes try to access process.env variables.
