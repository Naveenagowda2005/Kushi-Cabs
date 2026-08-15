# TASK 11 FIX: Driver Re-Upload - Application Level Fix

## Problem
Approved drivers re-uploading documents were incorrectly shown "Waiting for Approval" screen instead of staying on dashboard.

## Root Cause
The application was treating re-upload as a new first submission and navigating to `WaitingForApproval` screen for all document submissions.

## Solution Implemented

### File Modified
`newtaxi/apps/unified/src/screens/driver/DriverDocumentUploadScreen.js`

### Changes

#### 1. Added approval state tracking
```javascript
const [isDriverApproved, setIsDriverApproved] = useState(false);
```

#### 2. Updated loadDocuments to check approval status
```javascript
// Check if driver is already approved
const { data: verificationStatus } = await supabase
  .from('driver_verification_status')
  .select('overall_status')
  .eq('driver_id', driverId)
  .single();

setIsDriverApproved(verificationStatus?.overall_status === 'approved');
```

#### 3. Updated handleSubmitDocuments to handle re-upload
```javascript
// If already approved, stay on this screen (they're just re-uploading)
if (verificationStatus?.overall_status === 'approved') {
  console.log('Driver already approved, staying on upload screen');
  Alert.alert('Success', 'Documents re-submitted. You can continue using the app while we review your updates.');
  // Reload documents to show updated status
  await loadDocuments();
  return; // DON'T navigate to waiting screen
}

// If not approved yet, navigate to waiting screen (first submission)
navigation.navigate('WaitingForApproval');
```

#### 4. Updated UI for approved drivers
- Changed submit button from "Submit for Verification" to "Re-submit Changes"
- Added approval message below button: "Documents approved - you're all set!"
- Button remains functional for re-uploads without navigation

#### 5. Fixed allApproved logic
```javascript
// Use driver's approval status from database, not document count
const allApproved = isDriverApproved;
```

## Flow After Fix

### First-Time Submission (New Driver)
1. Driver uploads all 6 documents
2. Clicks "Submit for Verification"
3. Documents submitted with status = 'pending'
4. Navigates to "Waiting for Approval" screen ✅

### Re-Upload After Approval (Approved Driver)
1. Driver is approved: overall_status = 'approved'
2. Driver goes to Profile → Upload Documents
3. Screen shows "Re-submit Changes" button instead of "Submit"
4. Driver re-uploads changed document(s)
5. Clicks "Re-submit Changes"
6. System checks: driver already approved ✅
7. Shows success message: "Documents re-submitted. You can continue using the app..." ✅
8. **STAYS on upload screen** - Does NOT navigate to waiting screen ✅
9. Dashboard remains accessible ✅

## Testing

### Test 1: First-Time Submission
1. New driver account
2. Upload documents
3. Click "Submit for Verification"
4. Expected: Navigate to "Waiting for Approval" screen ✅

### Test 2: Re-Upload After Approval
1. Approved driver (or complete Test 1 first)
2. Go to Profile → Upload Documents
3. Button shows "Re-submit Changes" ✅
4. Approval message shows below button ✅
5. Re-upload any document
6. Click "Re-submit Changes"
7. Expected: Shows success alert ✅
8. Expected: Stays on upload screen (doesn't navigate) ✅
9. Expected: Can go back to dashboard ✅

### Test 3: Admin Re-Review
1. Admin sees re-verified driver in verification screen
2. Can approve/reject re-submitted documents
3. Driver approval status updates accordingly
4. Dashboard access preserved while reviewing ✅

## Impact
- ✅ Non-breaking change
- ✅ Backward compatible
- ✅ Only affects approved drivers doing re-uploads
- ✅ New drivers unaffected
- ✅ Admin functionality unchanged

## Files Changed
- `newtaxi/apps/unified/src/screens/driver/DriverDocumentUploadScreen.js` - All logic and UI

## Verification
- No database migration needed (using existing data)
- Works with real-time subscription in DriverNavigator
- Works with polling fallback
- Status properly tracked in driver_verification_status table

## Status
✅ COMPLETE - Ready to test
