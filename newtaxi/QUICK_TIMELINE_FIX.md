# Quick Fix - Timeline Not Updating

## Problem
Documents upload but timeline stays on "pending"

## Root Cause
Verification status record not being created/updated properly

## Quick Fix (2 minutes)

### Step 1: Restart App
```bash
npx expo start --clear
```

### Step 2: Test Upload & Submit
1. Upload all 6 documents
2. Click "Submit for Verification"
3. Check console for logs

### Step 3: Check Console Output

You should see:
```
submitDocumentsForVerification: Starting for driver: <id>
submitDocumentsForVerification: Verification status updated
submitDocumentsForVerification: Verified status: {
  driver_id: "<id>",
  all_documents_submitted: true,
  submitted_at: "2026-06-01T...",
  overall_status: "pending"
}
```

And then:
```
loadTimelineData: Loading for driver: <id>
loadTimelineData: Retrieved documents: [6 documents]
loadTimelineData: Verification status: {...}
loadTimelineData: Step 3 - Documents submitted
loadTimelineData: Final step: 3
```

### Step 4: Verify Timeline
- Timeline should show **Step 3: Documents Submitted** as active
- Pull to refresh should work
- Progress bar should show 3/5

## If Still Not Working

### Check 1: Verify Database
```sql
-- Run in Supabase SQL Editor
SELECT * FROM driver_verification_status 
WHERE driver_id = '<your-user-id>';
```

Should show:
- `all_documents_submitted: true`
- `submitted_at: <timestamp>`

### Check 2: Manual Fix
If verification status not created, run:
```sql
INSERT INTO driver_verification_status (driver_id, all_documents_submitted, submitted_at)
VALUES ('<your-user-id>', true, NOW())
ON CONFLICT (driver_id) DO UPDATE SET
  all_documents_submitted = true,
  submitted_at = NOW();
```

Then refresh app.

### Check 3: Check Documents
```sql
SELECT COUNT(*) FROM driver_documents 
WHERE driver_id = '<your-user-id>';
```

Should show 6 documents

## Expected Result

After fix:
- ✅ Upload shows success
- ✅ Timeline shows Step 3
- ✅ Console shows all logs
- ✅ Database updated

---

**Time**: 2 minutes
**Status**: Ready to test
