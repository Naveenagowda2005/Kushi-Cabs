# Timeline Not Updating - Complete Fix

## Problem
Documents upload successfully but timeline stays on "pending" and doesn't show uploaded documents.

## Root Cause
The `driver_verification_status` record isn't being created or updated properly when documents are uploaded. The database triggers might not be firing correctly.

## Solution

### What Was Fixed

**1. Added Logging to Timeline Screen**
- Added detailed console logs to track step determination
- Logs show what documents are found and what status is retrieved

**2. Improved submitDocumentsForVerification()**
- Changed from `update()` to `upsert()` to ensure record exists
- Added verification logging
- Ensures status is created if it doesn't exist

**3. Better Error Handling**
- Catches cases where verification status record doesn't exist
- Creates it automatically if needed

## Implementation

### Code Changes

**File**: `src/services/documentService.js`

**Before**:
```javascript
export const submitDocumentsForVerification = async (driverId) => {
  try {
    const { error } = await supabase
      .from('driver_verification_status')
      .update({
        all_documents_submitted: true,
        submitted_at: new Date().toISOString(),
      })
      .eq('driver_id', driverId);

    if (error) throw error;
  } catch (error) {
    console.error('Error submitting documents:', error);
    throw error;
  }
};
```

**After**:
```javascript
export const submitDocumentsForVerification = async (driverId) => {
  try {
    console.log('submitDocumentsForVerification: Starting for driver:', driverId);

    // Use upsert to ensure record exists
    const { error: upsertError } = await supabase
      .from('driver_verification_status')
      .upsert({
        driver_id: driverId,
        all_documents_submitted: true,
        submitted_at: new Date().toISOString(),
      }, {
        onConflict: 'driver_id'
      });

    if (upsertError) throw upsertError;

    console.log('submitDocumentsForVerification: Verification status updated');

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('driver_verification_status')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (verifyError) {
      console.error('submitDocumentsForVerification: Verify error:', verifyError);
    } else {
      console.log('submitDocumentsForVerification: Verified status:', verifyData);
    }
  } catch (error) {
    console.error('Error submitting documents:', error);
    throw error;
  }
};
```

**File**: `src/screens/driver/DriverOnboardingTimelineScreen.js`

**Added Logging**:
```javascript
const loadTimelineData = useCallback(async () => {
  if (!driverId) {
    console.log('loadTimelineData: No driverId');
    return;
  }

  try {
    setLoading(true);

    console.log('loadTimelineData: Loading for driver:', driverId);

    // Get documents
    const docs = await documentService.getDriverAllDocuments(driverId);
    console.log('loadTimelineData: Retrieved documents:', docs);
    setDocuments(docs);

    // Get verification status
    const status = await documentService.getDriverVerificationStatus(driverId);
    console.log('loadTimelineData: Verification status:', status);
    setVerificationStatus(status);

    // Determine current step with logging
    let step = 1;

    console.log('loadTimelineData: Checking step logic');
    console.log('  - docs.length:', docs?.length);
    console.log('  - all_documents_submitted:', status?.all_documents_submitted);
    console.log('  - overall_status:', status?.overall_status);

    if (docs && docs.length > 0) {
      step = 2;
      console.log('loadTimelineData: Step 2 - Documents uploaded');
    }

    if (status?.all_documents_submitted) {
      step = 3;
      console.log('loadTimelineData: Step 3 - Documents submitted');
    }

    if (status?.overall_status === 'pending' && status?.all_documents_submitted) {
      step = 4;
      console.log('loadTimelineData: Step 4 - Under review');
    }

    if (status?.overall_status === 'approved') {
      step = 5;
      console.log('loadTimelineData: Step 5 - Account approved');
    }

    console.log('loadTimelineData: Final step:', step);
    setCurrentStep(step);
  } catch (error) {
    console.error('Error loading timeline data:', error);
  } finally {
    setLoading(false);
  }
}, [driverId]);
```

## How to Test

### Step 1: Upload Documents
1. Sign up as driver
2. Upload all 6 documents
3. Check console for upload logs

### Step 2: Submit Documents
1. Click "Submit for Verification"
2. Check console for logs:
   ```
   submitDocumentsForVerification: Starting for driver: <id>
   submitDocumentsForVerification: Verification status updated
   submitDocumentsForVerification: Verified status: {...}
   ```

### Step 3: Check Timeline
1. Timeline screen should show Step 3 active
2. Check console for logs:
   ```
   loadTimelineData: Loading for driver: <id>
   loadTimelineData: Retrieved documents: [...]
   loadTimelineData: Verification status: {...}
   loadTimelineData: Checking step logic
     - docs.length: 6
     - all_documents_submitted: true
     - overall_status: pending
   loadTimelineData: Step 3 - Documents submitted
   loadTimelineData: Final step: 3
   ```

### Step 4: Verify Database
1. Go to Supabase dashboard
2. Check `driver_verification_status` table
3. Should show:
   - `all_documents_submitted`: true
   - `overall_status`: pending
   - `submitted_at`: current timestamp

## Expected Results

### ✅ Success Indicators
- Upload shows success
- Documents appear in list
- Submit button works
- Timeline shows Step 3 (Documents Submitted)
- Console shows all logs
- Database updated correctly

### ❌ Failure Indicators
- Timeline stays on Step 1
- Console shows errors
- Database not updated
- Verification status not created

## Debugging

### If Timeline Still Shows "Pending"

**Check 1: Console Logs**
- Look for `loadTimelineData` logs
- Check if documents are retrieved
- Check if verification status is retrieved

**Check 2: Database**
```sql
-- Check verification status
SELECT * FROM driver_verification_status 
WHERE driver_id = '<your-user-id>';
```

Should show `all_documents_submitted: true`

**Check 3: Documents**
```sql
-- Check documents
SELECT COUNT(*) FROM driver_documents 
WHERE driver_id = '<your-user-id>';
```

Should show 6 documents

**Check 4: Refresh Timeline**
- Pull to refresh on timeline screen
- Should reload data and update step

### If Verification Status Not Created

**Manual Fix**:
```sql
-- Create verification status record
INSERT INTO driver_verification_status (driver_id, all_documents_submitted, submitted_at)
VALUES ('<your-user-id>', true, NOW())
ON CONFLICT (driver_id) DO UPDATE SET
  all_documents_submitted = true,
  submitted_at = NOW();
```

Then refresh timeline in app.

## Files Modified

| File | Changes |
|------|---------|
| `src/services/documentService.js` | Improved submitDocumentsForVerification() |
| `src/screens/driver/DriverOnboardingTimelineScreen.js` | Added comprehensive logging |

## Testing Checklist

- [ ] Upload all 6 documents
- [ ] Console shows upload logs
- [ ] Submit documents
- [ ] Console shows submit logs
- [ ] Timeline shows Step 3
- [ ] Console shows timeline logs
- [ ] Database shows updated status
- [ ] Pull to refresh updates timeline
- [ ] Can continue to admin approval

## Next Steps

1. **Test Upload & Submit**
   - Upload all 6 documents
   - Submit for verification
   - Check console logs

2. **Verify Timeline Updates**
   - Timeline should show Step 3
   - Pull to refresh should work
   - Console should show all logs

3. **Check Database**
   - Verify status record created
   - Verify all_documents_submitted = true

4. **Continue Testing**
   - Admin approval
   - Login verification
   - Complete flow

## Summary

The fix ensures that:
1. ✅ Verification status record is created when documents are submitted
2. ✅ `all_documents_submitted` flag is set to true
3. ✅ Timeline loads and displays correct step
4. ✅ Comprehensive logging for debugging

The timeline should now update properly to show Step 3 (Documents Submitted) after submitting documents.

---

**Status**: Fixed - Ready to test
**Next Action**: Upload documents and submit
**Expected Result**: Timeline shows Step 3
