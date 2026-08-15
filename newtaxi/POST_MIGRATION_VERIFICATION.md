# Post-Migration 043 Verification Checklist

**Migration**: 043_add_new_document_types.sql  
**Status**: Applied ✅  
**Date**: Today

Use this checklist to verify everything is working correctly after migration.

---

## ✅ Database Verification

### Enum Values Check
```sql
-- Run in Supabase SQL Editor
SELECT enum_range(NULL::driver_document_type);

-- Should include all 9:
-- DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC, 
-- AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE
```

**Result**: [ ] Pass [ ] Fail

---

### Table Structure Check
```sql
-- Check driver_documents table structure
\d driver_documents;

-- Should have document_type column with driver_document_type enum
```

**Result**: [ ] Pass [ ] Fail

---

### Triggers Check
```sql
-- List all triggers
SELECT * FROM pg_trigger;

-- Should see:
-- - trg_check_all_documents_submitted
-- - trg_update_overall_verification_status
```

**Result**: [ ] Pass [ ] Fail

---

## ✅ Frontend Verification

### Service Layer
- [ ] `documentService.js` loads without errors
- [ ] `getDocumentLabel('AADHAR')` returns "Aadhar ID"
- [ ] `getDocumentLabel('BANK_PASSBOOK_FRONT')` returns "Bank Passbook Front"
- [ ] `getDocumentLabel('DRIVER_SELFIE')` returns "Driver Selfie"
- [ ] `getDocumentIcon('AADHAR')` returns "id-card-outline"
- [ ] `getDocumentIcon('DRIVER_SELFIE')` returns "person-circle-outline"

**Status**: [ ] All Pass [ ] Some Fail

---

### Upload Screen
- [ ] Screen displays all 9 documents
- [ ] Progress bar shows `0/9` initially
- [ ] Each document card shows correctly
- [ ] Icons match configuration
- [ ] Labels match configuration
- [ ] Scroll view shows all 9 without cut-off

**Status**: [ ] All Pass [ ] Some Fail

---

### Camera Integration
- [ ] Documents 1-8 show "Camera/Gallery" choice
- [ ] Document 9 (DRIVER_SELFIE) auto-launches camera
- [ ] Camera permission prompt appears
- [ ] Camera opens successfully
- [ ] Can take photo from camera
- [ ] Can select photo from gallery (for 8 docs)

**Status**: [ ] All Pass [ ] Some Fail

---

### Progress Tracking
- [ ] Progress bar updates as documents upload
- [ ] Progress count increments (e.g., 1/9, 2/9, etc.)
- [ ] Progress reaches 9/9 when all uploaded
- [ ] Submit button enables at 9/9
- [ ] Submit button stays disabled until 9/9

**Status**: [ ] All Pass [ ] Some Fail

---

## ✅ Functional Testing

### New Driver Registration Flow

**Step 1: Registration**
- [ ] Can enter phone number
- [ ] OTP received successfully
- [ ] OTP verification works
- [ ] Password setup works
- [ ] Profile creation works

**Status**: [ ] Pass [ ] Fail

---

**Step 2: Document Upload**
- [ ] Navigate to document upload screen
- [ ] See all 9 documents
- [ ] Can upload document 1 (Camera)
- [ ] Can upload document 2 (Gallery)
- [ ] Can upload document 3-8 (Either)
- [ ] Can upload document 9 (Camera only)
- [ ] Progress bar updates after each upload
- [ ] All documents show "Uploaded" status

**Status**: [ ] Pass [ ] Fail

---

**Step 3: Submission**
- [ ] Submit button enabled after all 9 uploaded
- [ ] Can click Submit button
- [ ] Submission completes without errors
- [ ] Navigate to WaitingForApprovalScreen
- [ ] See correct submission info

**Status**: [ ] Pass [ ] Fail

---

**Step 4: Database Check**
- [ ] New document records in `driver_documents` table
- [ ] All 9 documents have `status = 'pending_review'`
- [ ] All 9 documents have `document_data` (not null)
- [ ] `driver_verification_status` shows `pending_review`
- [ ] `submitted_at` timestamp recorded

**Status**: [ ] Pass [ ] Fail

---

### Super Admin Verification

**Step 1: Admin Login**
- [ ] Can login with admin credentials
- [ ] Navigate to verification dashboard
- [ ] Dashboard loads without errors

**Status**: [ ] Pass [ ] Fail

---

**Step 2: Document Review**
- [ ] Can see pending drivers in list
- [ ] Can click driver to see documents
- [ ] Can see all 9 documents for driver
- [ ] Each document shows:
  - [ ] Document name
  - [ ] Document type
  - [ ] Upload status
  - [ ] Approve button
  - [ ] Reject button

**Status**: [ ] Pass [ ] Fail

---

**Step 3: Approval/Rejection**
- [ ] Can click Approve button
- [ ] Document status changes to `approved`
- [ ] Can approve all 9 documents
- [ ] Can reject document (shows reason field)
- [ ] Can re-submit rejected documents

**Status**: [ ] Pass [ ] Fail

---

**Step 4: Final Status**
- [ ] After all 9 approved: Driver status = `approved`
- [ ] Driver can now login
- [ ] Driver sees dashboard (not WaitingForApprovalScreen)
- [ ] Driver can use all features

**Status**: [ ] Pass [ ] Fail

---

## ✅ Edge Cases

### Document Rejection
- [ ] Can reject single document
- [ ] Driver sees rejection with reason
- [ ] Driver can re-upload rejected document
- [ ] Can resubmit after fixing rejection
- [ ] Admin sees updated documents

**Status**: [ ] Pass [ ] Fail

---

### Partial Uploads
- [ ] Cannot submit with only 8 documents
- [ ] Submit button stays disabled
- [ ] Message shows documents still needed
- [ ] Once 9th uploaded: Submit button enables

**Status**: [ ] Pass [ ] Fail

---

### Refresh/Reload
- [ ] Refresh upload screen: Uploaded docs still show
- [ ] Refresh admin dashboard: Pending drivers still show
- [ ] No data lost on refresh
- [ ] All statuses preserved

**Status**: [ ] Pass [ ] Fail

---

### Multiple Drivers
- [ ] Second driver can register
- [ ] Can upload different 9 documents
- [ ] Each driver's documents tracked separately
- [ ] Admin can verify multiple drivers
- [ ] No cross-driver data leakage

**Status**: [ ] Pass [ ] Fail

---

## ✅ Performance

- [ ] Upload screen loads in < 2 seconds
- [ ] Document cards render smoothly
- [ ] No app crashes during upload
- [ ] Camera launches quickly
- [ ] Admin dashboard responsive
- [ ] Document list scrolls smoothly
- [ ] Submit request completes in < 5 seconds

**Status**: [ ] All OK [ ] Issues Found

---

## ✅ Error Handling

- [ ] Network error during upload: Handled gracefully
- [ ] Camera permission denied: User gets error message
- [ ] Database error: User gets retry option
- [ ] Invalid file: User gets error message
- [ ] Missing fields: Submit button disabled

**Status**: [ ] All Pass [ ] Some Issues

---

## ✅ Data Integrity

- [ ] All 9 documents stored in database
- [ ] Base64 data not corrupted
- [ ] Document types correct in database
- [ ] Status values correct
- [ ] Timestamps recorded
- [ ] User associations correct

**Status**: [ ] Pass [ ] Fail

---

## ✅ Security

- [ ] Super admin can't see other admin's work (if multiple)
- [ ] Drivers can't access other drivers' documents
- [ ] RLS policies enforced correctly
- [ ] Unauthenticated users can't access documents
- [ ] Base64 data not readable in browser

**Status**: [ ] Pass [ ] Fail

---

## 🔧 Issue Resolution

### If Upload Screen Shows Only 6 Documents

**Check**:
1. [ ] Migration 043 applied in Supabase
2. [ ] App rebuilt: `expo start --clean`
3. [ ] Service layer has all 9 labels
4. [ ] REQUIRED_DOCUMENTS array has 9 items

**Fix**:
- Rebuild app and try again
- Clear app cache and restart
- Verify migration was applied

---

### If Camera Doesn't Launch for DRIVER_SELFIE

**Check**:
1. [ ] Camera permission granted
2. [ ] Device has camera
3. [ ] DocumentUploadCard logic correct
4. [ ] expo-image-picker installed

**Fix**:
- Grant camera permission when prompted
- Test on different device
- Check console for errors

---

### If Submit Button Stays Disabled

**Check**:
1. [ ] All 9 documents uploaded (check status badge)
2. [ ] Each document shows "Uploaded" status
3. [ ] No errors in console
4. [ ] Documents have `document_data` field

**Fix**:
- Verify each document completely uploaded
- Refresh screen
- Re-upload any that seem incomplete

---

### If Admin Can't See Pending Drivers

**Check**:
1. [ ] Driver actually submitted (status = pending_review)
2. [ ] Admin logged in as super_admin
3. [ ] RLS policies correct
4. [ ] No console errors

**Fix**:
- Verify driver submitted documents
- Check admin role in database
- Refresh dashboard
- Check Supabase logs

---

## 📊 Summary Template

```
═══════════════════════════════════════════════════
  POST-MIGRATION 043 VERIFICATION SUMMARY
═══════════════════════════════════════════════════

Database Verification: [ ] PASS [ ] FAIL
Frontend Verification: [ ] PASS [ ] FAIL
Functional Testing: [ ] PASS [ ] FAIL
Edge Cases: [ ] PASS [ ] FAIL
Performance: [ ] PASS [ ] FAIL
Error Handling: [ ] PASS [ ] FAIL
Data Integrity: [ ] PASS [ ] FAIL
Security: [ ] PASS [ ] FAIL

Overall Status: [ ] READY [ ] ISSUES FOUND

Issues Found:
- (List any issues here)

Resolution:
- (List solutions attempted)

Approved By: ________________  Date: ________
```

---

## ✅ Go-Live Checklist

Before deploying to production:

- [ ] All verification tests pass
- [ ] No critical issues found
- [ ] Database backup taken
- [ ] Error monitoring configured
- [ ] Admin trained on verification
- [ ] Support team briefed
- [ ] Deployment plan documented
- [ ] Rollback plan ready

**Ready for Production**: [ ] YES [ ] NO

---

## 📞 Support

If issues are found:

1. **Document the issue**: Describe what happened
2. **Capture error**: Screenshot or console log
3. **Reproduce**: Can it be repeated?
4. **Environment**: Device type, app version, etc.
5. **Contact**: Reference this checklist in support ticket

---

**Verification Complete**: ✅  
**Status**: Ready for use  
**Date**: ________  
**Verified By**: ________
