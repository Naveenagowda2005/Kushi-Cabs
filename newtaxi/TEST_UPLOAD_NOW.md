# Test Document Upload - Step by Step

## Status: ✅ Migration Applied, App Running

The RLS policies have been updated and the app is running on port 8081.

## Test Steps

### Step 1: Open App and Sign Up as Driver

1. Open the app (should be running on port 8081)
2. Select **"Driver"** role
3. Click **"Sign Up"**
4. Enter phone: **9686314982**
5. Click **"Request OTP"**
6. Enter OTP (check backend logs or use test OTP)
7. Click **"Verify"**
8. Fill registration form:
   - Full Name: Test Driver
   - License Number: DL123456
   - Vehicle Number: MH01AB1234
9. Click **"Complete Registration"**

### Step 2: Upload Document

1. You should be redirected to **"Upload Documents"** screen
2. Click on **"Driver License"** card
3. Select **"Take Photo"** or **"Choose from Gallery"**
4. Select/take an image
5. **Watch the console** for logs

### Step 3: Check Console Logs

Open your browser console or terminal where Expo is running. You should see:

```
handleUploadDocument: Starting upload for DL
handleUploadDocument: Image picked, uploading to database
uploadDocumentImage: Starting upload for DL driver: <user-id>
uploadDocumentImage: Base64 data length: <number>
uploadDocumentImage: Successfully uploaded DL
handleUploadDocument: Upload successful, reloading documents
loadDocuments: Loading documents for driver: <user-id>
loadDocuments: Retrieved documents: [...]
handleUploadDocument: Documents reloaded
```

### Step 4: Verify in App

1. After upload, you should see:
   - ✅ Success alert: "Driver License uploaded successfully"
   - ✅ Document card shows status (should be "pending")
   - ✅ Progress bar updates to show 1/6 documents

### Step 5: Verify in Database

1. Go to **Supabase Dashboard**
2. Click **"Table Editor"**
3. Select **`driver_documents`** table
4. You should see a new row with:
   - `driver_id`: Your user ID
   - `document_type`: DL
   - `document_data`: Base64 string (long text)
   - `status`: pending
   - `uploaded_at`: Current timestamp

## Expected Results

### ✅ Success Indicators

- [ ] Upload shows success alert
- [ ] Document appears in list with "pending" status
- [ ] Progress bar shows 1/6
- [ ] Console shows all logs
- [ ] Database has new row in `driver_documents`
- [ ] Can upload another document (progress shows 2/6)
- [ ] Can upload all 6 documents

### ❌ If Upload Fails

**Check 1: Console Error**
- Look for error message in console
- Common errors:
  - "RLS policy violation" - RLS policies not updated
  - "Invalid image data" - Image picker issue
  - "Network error" - Connection issue

**Check 2: Verify RLS Policies**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'driver_documents';
```
Should show policies with 'super_admin' (not 'admin')

**Check 3: Check User Authentication**
- Verify user is logged in
- Check if `auth.uid()` is set
- Verify user has 'driver' role

## Troubleshooting

### Issue: "RLS policy violation"
**Solution**: RLS policies not updated correctly
- Go to Supabase SQL Editor
- Run the SQL from QUICK_FIX_GUIDE.md again
- Verify policies show 'super_admin'

### Issue: "Invalid image data"
**Solution**: Image picker not working
- Try using gallery instead of camera
- Check if permissions are granted
- Try a different image

### Issue: "Network error"
**Solution**: Connection issue
- Check internet connection
- Verify Supabase URL in .env
- Check if Supabase is accessible

### Issue: Document not appearing in database
**Solution**: Check RLS policies
- Verify `auth.uid()` matches `driver_id`
- Check if user is properly authenticated
- Run debug script: `debug-document-upload.js`

## Next Steps After Successful Upload

1. **Upload All 6 Documents**
   - DL (Driver License)
   - VEHICLE_FRONT (Vehicle Front Photo)
   - INSURANCE (Insurance Certificate)
   - FC (Fitness Certificate)
   - EMISSION (Emission Certificate)
   - RC (Registration Certificate)

2. **Submit Documents**
   - Click "Submit for Verification"
   - Should be logged out
   - Should see timeline screen

3. **Test Admin Approval**
   - Login as Super Admin
   - Go to Admin Verification Dashboard
   - Approve documents
   - Check if timeline updates

4. **Test Driver Login**
   - Try to login as driver (should fail - documents pending)
   - Admin approves documents
   - Try to login again (should succeed)

## Console Log Reference

### Successful Upload Logs
```
handleUploadDocument: Starting upload for DL
handleUploadDocument: Image picked, uploading to database
uploadDocumentImage: Starting upload for DL driver: 550e8400-e29b-41d4-a716-446655440000
uploadDocumentImage: Base64 data length: 45678
uploadDocumentImage: Successfully uploaded DL
handleUploadDocument: Upload successful, reloading documents
loadDocuments: Loading documents for driver: 550e8400-e29b-41d4-a716-446655440000
loadDocuments: Retrieved documents: [
  {
    id: "...",
    driver_id: "550e8400-e29b-41d4-a716-446655440000",
    document_type: "DL",
    status: "pending",
    document_data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    ...
  }
]
handleUploadDocument: Documents reloaded
```

### Failed Upload Logs
```
handleUploadDocument: Starting upload for DL
handleUploadDocument: Image picked, uploading to database
uploadDocumentImage: Starting upload for DL driver: 550e8400-e29b-41d4-a716-446655440000
uploadDocumentImage: Base64 data length: 45678
uploadDocumentImage: Insert error: {
  code: "42501",
  message: "new row violates row-level security policy \"drivers_upload_documents\" on table \"driver_documents\"",
  ...
}
Error uploading document: Error: new row violates row-level security policy...
Upload error: Error: new row violates row-level security policy...
```

## Quick Checklist

- [ ] App running on port 8081
- [ ] Migration applied to Supabase
- [ ] Signed up as driver
- [ ] Uploaded first document
- [ ] Console shows success logs
- [ ] Document appears in app
- [ ] Document in Supabase database
- [ ] Can upload second document
- [ ] Progress bar updates correctly

## Support

If you encounter issues:
1. Check console logs for error messages
2. Review DOCUMENT_UPLOAD_FIX.md for detailed explanation
3. Run debug script: `debug-document-upload.js`
4. Check Supabase RLS policies
5. Verify user authentication

---

**Status**: Ready to test
**Next**: Upload a document and check console logs
