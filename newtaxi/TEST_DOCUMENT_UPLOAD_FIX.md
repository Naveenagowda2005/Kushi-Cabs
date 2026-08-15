# Test Document Upload Fix

## What Was Fixed
✅ Document uploads now save to database (not just shown in UI)
✅ Admin dashboard can see pending drivers
✅ Full verification workflow works

## How to Test

### Test 1: New Driver - Document Upload
**Steps**:
1. Open app on device/emulator
2. Select "Driver"
3. Enter phone number (any 10 digits)
4. Click "Get OTP"
5. Enter OTP (from backend logs)
6. Set password
7. Enter name and details
8. Go to "Upload Documents"
9. Upload all 9 documents (camera or gallery)
10. Submit for verification

**Check Success**:
- UI shows "successfully uploaded"
- No "violates row-level security policy" errors
- Can proceed to WaitingForApprovalScreen

### Test 2: Admin - Verify Documents
**Steps**:
1. Login as super admin
2. Go to verification dashboard
3. Look for the driver you just tested

**Check Success**:
- Driver appears in pending list ✅
- Can view all 9 documents ✅
- Can approve/reject each document ✅

### Test 3: Documents Actually Saved
**Steps** (optional - check database):
1. Go to Supabase dashboard
2. Check `driver_documents` table
3. Should see 9 records for the test driver
4. Each with `status = 'pending_review'`

**Check Success**:
- 9 document records exist ✅
- All have `document_data` (not NULL) ✅
- Status is `pending_review` ✅

## Expected Behavior

### Before Fix (❌ Broken):
```
Driver uploads documents
UI shows "successfully uploaded"
Database check: 0 documents
Admin dashboard: 0 pending drivers
Error in logs: "violates row-level security policy"
```

### After Fix (✅ Working):
```
Driver uploads documents
UI shows "successfully uploaded"
Database check: 9 documents stored
Admin dashboard: Shows pending driver
No RLS policy errors
```

## Troubleshooting

### If Still Getting RLS Policy Error
1. Check if frontend was restarted (cache issue)
2. Look in logs: should see "Creating OTP-verified session"
3. If error persists, check that `supabase.auth.setSession()` was called

### If Admin Dashboard Still Empty
1. Verify driver submitted (not just uploaded)
2. Check `driver_verification_status` table has record
3. Verify super admin is logged in with correct role

### If Documents Show But Can't See in Admin
1. Restart admin dashboard page
2. Check browser console for errors
3. Verify super admin role is correct (`role_id = super_admin`)

## Success Checklist

- [ ] New driver can register
- [ ] Driver can upload all 9 documents
- [ ] No RLS policy errors
- [ ] UI shows successful upload
- [ ] Can submit documents
- [ ] Admin can see pending driver
- [ ] Admin can view all 9 documents
- [ ] Admin can approve/reject documents
- [ ] Once approved: Driver can login to dashboard

---

**If all checks pass**: ✅ Fix is working correctly!
