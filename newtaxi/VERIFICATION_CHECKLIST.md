# Document Upload Fix - Verification Checklist

## ✅ Completed Tasks

### Database Migration
- [x] RLS policies updated with 'super_admin' role name
- [x] Migration applied to Supabase
- [x] 4 policies fixed:
  - super_admins_view_all_documents
  - super_admins_verify_documents
  - super_admins_view_all_verification_status
  - super_admins_view_all_users_verification_status

### Code Updates
- [x] documentService.js - Improved upload logic
  - Changed from upsert to delete-then-insert
  - Added comprehensive logging
  - Better error handling

- [x] DriverDocumentUploadScreen.js - Added logging
  - handleUploadDocument() - logs each step
  - loadDocuments() - logs retrieved documents
  - Better error messages

### Documentation
- [x] QUICK_FIX_GUIDE.md - 5-minute fix guide
- [x] DOCUMENT_UPLOAD_FIX.md - Detailed explanation
- [x] TEST_UPLOAD_NOW.md - Testing guide
- [x] debug-document-upload.js - Debug script

## 🧪 Testing Checklist

### Pre-Test Verification
- [ ] Expo server running on port 8081
- [ ] Backend SMS server running on port 4000
- [ ] Supabase accessible
- [ ] Migration applied successfully

### Test 1: Basic Upload
- [ ] Sign up as driver
- [ ] Redirected to document upload screen
- [ ] Can select image from gallery
- [ ] Can take photo with camera
- [ ] Upload shows success alert
- [ ] Console shows upload logs
- [ ] Document appears in list

### Test 2: Database Verification
- [ ] Go to Supabase dashboard
- [ ] Check driver_documents table
- [ ] New row exists with:
  - [ ] driver_id = user ID
  - [ ] document_type = DL
  - [ ] document_data = base64 string
  - [ ] status = pending
  - [ ] uploaded_at = current time

### Test 3: Multiple Documents
- [ ] Upload second document (VEHICLE_FRONT)
- [ ] Progress bar shows 2/6
- [ ] Upload third document (INSURANCE)
- [ ] Progress bar shows 3/6
- [ ] Continue until all 6 uploaded
- [ ] Progress bar shows 6/6

### Test 4: Document Submission
- [ ] Click "Submit for Verification"
- [ ] Alert shows success message
- [ ] Driver logged out
- [ ] Redirected to timeline screen
- [ ] Timeline shows Step 3 active

### Test 5: Admin Verification
- [ ] Login as Super Admin
- [ ] Go to Admin Verification Dashboard
- [ ] See pending driver documents
- [ ] Can view document preview
- [ ] Can approve documents
- [ ] Can reject documents
- [ ] Timeline updates after approval

### Test 6: Login After Approval
- [ ] Logout from admin
- [ ] Try to login as driver (before approval)
- [ ] Login rejected with message
- [ ] Admin approves documents
- [ ] Try to login as driver (after approval)
- [ ] Login successful
- [ ] Can access dashboard

## 🔍 Verification Commands

### Check RLS Policies
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'driver_documents';
```
Should show 4 policies with 'super_admin' role name

### Check Documents Table
```sql
-- Run in Supabase SQL Editor
SELECT * FROM driver_documents LIMIT 10;
```
Should show uploaded documents with base64 data

### Check User Role
```sql
-- Run in Supabase SQL Editor
SELECT u.id, u.phone, r.name as role
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.phone = '9686314982';
```
Should show role as 'driver'

### Check RLS Enabled
```sql
-- Run in Supabase SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('driver_documents', 'driver_verification_status');
```
Should show rowsecurity = true for both tables

## 📊 Expected Results

### ✅ Success Indicators
- Document upload shows success alert
- Document appears in list with "pending" status
- Progress bar updates correctly
- Console shows all logs
- Database has new row
- Admin can see documents
- Admin can approve/reject
- Driver can login after approval

### ❌ Failure Indicators
- Upload shows error alert
- Document doesn't appear in list
- Console shows RLS policy error
- Database has no new row
- Admin cannot see documents

## 🐛 Debugging Steps

### If Upload Fails

**Step 1: Check Console Logs**
- Look for error message
- Check if logs show "Starting upload"
- Check if logs show "Successfully uploaded"

**Step 2: Verify RLS Policies**
- Run SQL command above
- Verify policies use 'super_admin'
- Check if policies are enabled

**Step 3: Check User Authentication**
- Verify user is logged in
- Check if auth.uid() is set
- Verify user has 'driver' role

**Step 4: Run Debug Script**
- Use debug-document-upload.js
- Test each step individually
- Check for specific errors

## 📝 Files Modified

1. ✅ `supabase/migrations/039_driver_verification_rls_policies.sql`
   - Fixed 4 RLS policies
   - Changed 'admin' to 'super_admin'

2. ✅ `src/services/documentService.js`
   - Improved uploadDocumentImage()
   - Added comprehensive logging
   - Changed to delete-then-insert pattern

3. ✅ `src/screens/driver/DriverDocumentUploadScreen.js`
   - Added logging to handleUploadDocument()
   - Added logging to loadDocuments()
   - Better error messages

4. ✅ `debug-document-upload.js` (NEW)
   - Debug script for testing

## 🎯 Success Criteria

All of the following must be true:

1. **Upload Works**
   - [ ] Document uploads without error
   - [ ] Success alert shown
   - [ ] Document appears in list

2. **Database Storage**
   - [ ] Document stored in driver_documents table
   - [ ] Base64 data present
   - [ ] Status is "pending"

3. **Admin Features**
   - [ ] Admin can see documents
   - [ ] Admin can approve/reject
   - [ ] Timeline updates

4. **Login Verification**
   - [ ] Cannot login before approval
   - [ ] Can login after approval

## 📋 Next Steps

1. **Test Upload**
   - Follow TEST_UPLOAD_NOW.md
   - Upload a document
   - Check console logs

2. **Verify Database**
   - Check Supabase dashboard
   - Confirm document stored

3. **Test Complete Flow**
   - Upload all 6 documents
   - Submit for verification
   - Admin approves
   - Driver logs in

4. **Deploy**
   - If all tests pass
   - Deploy to production

## 🚀 Status

- [x] Code fixes applied
- [x] Migration applied
- [x] Documentation created
- [ ] Testing in progress
- [ ] Verification complete
- [ ] Ready for deployment

---

**Last Updated**: June 1, 2026
**Status**: Ready for Testing
**Next Action**: Test document upload
