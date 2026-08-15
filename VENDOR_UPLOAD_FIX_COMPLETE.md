# Vendor Document Upload - Complete Analysis & Fix

## Current System Status

### Database State (from debug endpoint):
- ✅ Vendor record exists in `vendors` table
- ✅ User record exists in `users` table  
- ✅ Vendor documents exist in `vendor_documents` table
- ✅ Vendor verification status exists in `vendor_verification_status` table
- ✅ Documents are uploaded and stored as base64

### Key Finding:
The RLS policy duplicate key error shows that vendor_documents records ARE being created and saved properly. The issue is NOT with saving documents.

## Problem Identification

### The Real Issue:
When vendor documents are uploaded, they are stored in `vendor_documents` table. The vendor can see them being uploaded in the UI. However, there are two potential issues:

1. **Issue 1: Documents not showing in the UI after upload** (Most likely)
   - The frontend may not be refreshing the documents list after upload
   - The `loadDocuments()` call after upload may be failing silently

2. **Issue 2: Vendor still sees "Waiting for Approval" after uploading** (Expected behavior)
   - This is CORRECT - vendor should wait after uploading
   - Only admin approval should change the status
   - Real-time update will show "Approved" once admin approves

## Solution: Enhanced Debugging & Logging

### Frontend Fixes (VendorDocumentUploadScreen.js):

The enhanced logging I added should show exactly where the upload is failing. Key areas to check in console:

1. **After upload, look for:**
   ```
   handleUploadDocument: User ID: [ID] Vendor ID: [ID]
   handleUploadDocument: Fetch result - existingDocs: true/false
   handleUploadDocument: INSERT/UPDATE result - error: null/[error]
   loadDocuments: Final documents list: [array of docs]
   ```

2. **If you see an INSERT error:**
   - Check if it's a duplicate key error (vendor_id already has record)
   - This means a previous upload succeeded
   - Should proceed to UPDATE instead

3. **If documents list shows null:**
   - RLS read policy might not be allowing the read
   - Check RLS policies on vendor_documents table

### Testing the Full Flow:

1. **Upload a document:**
   - Check console for the logs above
   - Confirm INSERT or UPDATE succeeded (error: null)
   - Check that loadDocuments shows the new document

2. **Submit for verification:**
   - Vendor clicks "Submit for Verification"
   - Should see success alert
   - vendor_verification_status.overall_status changes to 'pending'

3. **Admin approves:**
   - Admin views vendor in dashboard
   - Approves all documents
   - RPC calls update overall_status to 'approved'

4. **Real-time sync:**
   - Vendor gets real-time notification
   - Dashboard automatically switches to show dashboard
   - No manual refresh needed

## Next Steps to Debug Further

### If documents still not showing:

1. **Check Supabase RLS directly:**
   ```sql
   SELECT * FROM vendor_documents WHERE user_id = 'USER_ID';
   -- Should return the uploaded documents
   ```

2. **Check if read policy exists:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'vendor_documents' AND policyname LIKE '%view%' OR policyname LIKE '%read%';
   ```

3. **Manually test frontend fetch:**
   ```javascript
   const { data, error } = await supabase
     .from('vendor_documents')
     .select('*')
     .eq('user_id', 'USER_ID')
     .single();
   console.log('Data:', data);
   console.log('Error:', error);
   ```

## Expected Behavior After Fix

### Vendor Upload Flow:
1. Vendor picks image → Upload starts
2. Image converts to base64 (shown in logs)
3. INSERT or UPDATE to vendor_documents succeeds
4. `loadDocuments()` fetches fresh list
5. UI updates showing uploaded document
6. Vendor taps "Submit for Verification"
7. vendor_verification_status created/updated with overall_status = 'pending'
8. Navigates to waiting screen

### Admin Approval Flow:
1. Admin sees vendor in dashboard
2. Admin reviews and approves all documents
3. RPC calls update overall_status to 'approved'
4. Real-time channel notifies vendor
5. VendorNavigator receives update
6. Dashboard automatically switches from waiting screen to main dashboard

## Files to Monitor:

1. **Console logs in:**
   - `VendorDocumentUploadScreen.js` - handleUploadDocument
   - `VendorWaitingForApprovalScreen.js` - loadVerificationStatus
   - `VendorNavigator.js` - real-time subscription
   
2. **Backend endpoint:**
   - GET `/admin/vendor-debug/:userId` - Check database state

3. **Database tables:**
   - `vendor_documents` - Should have uploaded records
   - `vendor_verification_status` - Should have status = 'pending' after submit
   - `users` - Should have verification_status field updated
