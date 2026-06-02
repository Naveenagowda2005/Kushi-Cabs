# Fix Timeline Not Updating - Verification Status Issue

## Problem
Documents upload successfully but timeline stays on "pending" and doesn't show uploaded documents.

## Root Cause
The `driver_verification_status` record might not be created or updated properly when documents are uploaded.

## Solution

### Step 1: Check if Verification Status Record Exists

Run this SQL in Supabase:

```sql
-- Check if verification status record exists for your driver
SELECT * FROM driver_verification_status 
WHERE driver_id = '<your-user-id>';
```

**If no record exists**: The trigger didn't create it
**If record exists**: Check the values

### Step 2: Manually Create/Update Verification Status

If the record doesn't exist, create it:

```sql
-- Insert verification status record
INSERT INTO driver_verification_status (driver_id)
VALUES ('<your-user-id>')
ON CONFLICT (driver_id) DO NOTHING;
```

### Step 3: Update Verification Status Based on Documents

After uploading documents, run this to update the status:

```sql
-- Update verification status based on uploaded documents
UPDATE driver_verification_status
SET all_documents_submitted = (
  SELECT COUNT(DISTINCT document_type) >= 6
  FROM driver_documents
  WHERE driver_id = '<your-user-id>'
)
WHERE driver_id = '<your-user-id>';
```

### Step 4: Verify the Update

```sql
-- Check the updated status
SELECT * FROM driver_verification_status 
WHERE driver_id = '<your-user-id>';
```

Should show:
- `all_documents_submitted`: true (if 6 documents uploaded)
- `overall_status`: pending

### Step 5: Refresh Timeline in App

1. Go back to timeline screen
2. Pull to refresh
3. Timeline should now show Step 2 or higher

## Automatic Fix (Better Solution)

The issue is that the trigger might not be firing properly. Let me create a function to manually trigger the update:

### Create a Helper Function

Run this SQL in Supabase:

```sql
-- Create function to update verification status for a driver
CREATE OR REPLACE FUNCTION update_driver_verification_status_manual(driver_id_param UUID)
RETURNS void AS $$
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
  WHERE driver_id = driver_id_param;
  
  -- Determine new status
  IF rejected_count > 0 THEN
    new_status := 'rejected'::verification_status;
  ELSIF approved_count = total_required THEN
    new_status := 'approved'::verification_status;
  ELSE
    new_status := 'pending'::verification_status;
  END IF;
  
  -- Insert or update verification status
  INSERT INTO driver_verification_status (driver_id, overall_status, all_documents_submitted)
  VALUES (
    driver_id_param,
    new_status,
    (submitted_count >= total_required)
  )
  ON CONFLICT (driver_id) DO UPDATE SET
    overall_status = new_status,
    all_documents_submitted = (submitted_count >= total_required),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### Use the Helper Function

After uploading documents, run:

```sql
-- Update verification status for your driver
SELECT update_driver_verification_status_manual('<your-user-id>');
```

## Debugging Steps

### Step 1: Check Documents Uploaded

```sql
-- See all documents for your driver
SELECT document_type, status, uploaded_at
FROM driver_documents
WHERE driver_id = '<your-user-id>'
ORDER BY document_type;
```

Should show all uploaded documents with status 'pending'

### Step 2: Check Verification Status

```sql
-- Check verification status
SELECT * FROM driver_verification_status
WHERE driver_id = '<your-user-id>';
```

Should show:
- `all_documents_submitted`: true (if 6 documents)
- `overall_status`: pending

### Step 3: Check Triggers

```sql
-- List all triggers on driver_documents table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'driver_documents';
```

Should show 3 triggers:
- `trg_create_verification_status`
- `trg_check_all_documents_submitted`
- `trg_update_overall_verification_status`

### Step 4: Check Trigger Execution

If triggers aren't firing, they might be disabled. Enable them:

```sql
-- Triggers should be enabled by default, but check:
SELECT * FROM pg_trigger WHERE tgname LIKE 'trg_%' AND tgrelid = 'driver_documents'::regclass;
```

## Quick Fix for Testing

If you need to test immediately:

1. **Upload all 6 documents** through the app
2. **Run this SQL** in Supabase:

```sql
-- Replace <your-user-id> with your actual user ID
UPDATE driver_verification_status
SET all_documents_submitted = true,
    submitted_at = NOW()
WHERE driver_id = '<your-user-id>';
```

3. **Refresh the app** - Timeline should update to Step 3

## Permanent Fix

The issue is likely that the triggers aren't firing properly. To fix permanently:

### Option 1: Re-apply Migration 040

```bash
cd newtaxi
supabase db push
```

This will recreate all triggers properly.

### Option 2: Manually Recreate Triggers

Run the SQL from migration 040 to recreate the triggers.

### Option 3: Add Manual Update in App

Update the `submitDocumentsForVerification()` function to manually update the status:

```javascript
export const submitDocumentsForVerification = async (driverId) => {
  try {
    // Update verification status
    const { error } = await supabase
      .from('driver_verification_status')
      .upsert({
        driver_id: driverId,
        all_documents_submitted: true,
        submitted_at: new Date().toISOString(),
      }, {
        onConflict: 'driver_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error submitting documents:', error);
    throw error;
  }
};
```

## Testing Checklist

- [ ] Documents uploaded (check in database)
- [ ] Verification status record exists
- [ ] `all_documents_submitted` is true
- [ ] Timeline shows Step 2 or higher
- [ ] Pull to refresh updates timeline
- [ ] Can submit documents

## Files to Check

1. `supabase/migrations/037_driver_documents_verification.sql` - Triggers
2. `supabase/migrations/040_fix_document_data_type.sql` - Recreated triggers
3. `src/services/documentService.js` - submitDocumentsForVerification()
4. `src/screens/driver/DriverOnboardingTimelineScreen.js` - Timeline logic

## Next Steps

1. **Check if verification status record exists**
   - Run SQL query above
   - If not, create it manually

2. **Update verification status**
   - Run the update SQL
   - Or use the helper function

3. **Refresh timeline**
   - Pull to refresh in app
   - Should show updated step

4. **If still not working**
   - Check triggers are enabled
   - Re-apply migration 040
   - Check console logs

---

**Status**: Debugging in progress
**Next Action**: Check verification status record in database
