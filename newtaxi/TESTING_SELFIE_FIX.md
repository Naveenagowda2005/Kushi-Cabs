# Testing Guide: Selfie Upload Fix

## Prerequisites
- Both servers running (Expo on 8082, Backend on 4000)
- Fresh driver account or one without documents submitted

## Test Scenario 1: Successful Selfie Upload

1. **Open app and login as driver**
   - Create new driver account (phone number)
   - You should see WaitingForApprovalScreen since no documents submitted

2. **Click "Upload/View Documents"**
   - Should navigate to DriverDocumentUploadScreen
   - See all 9 required documents listed

3. **Scroll to "Driver Selfie" (last document)**
   - Click on the card

4. **When upload alert appears**
   - For DRIVER_SELFIE, there's only Camera button (no Gallery option)
   - Click "Camera"

5. **Camera app should open**
   - Take a selfie photo
   - Click OK/Confirm to use the photo

6. **Expected Result ✅**
   - Should show: "Driver Selfie uploaded successfully" 
   - App does NOT crash
   - Can see the selfie marked as "Uploaded - Pending Review"
   - Console shows logs like:
     ```
     pickDocumentImage: Asset received - has base64: true
     uploadDocumentImage: Successfully uploaded DRIVER_SELFIE
     ```

## Test Scenario 2: Permission Denied

1. Follow steps 1-5 above, but DENY camera permission when prompted

2. **Expected Result ✅**
   - Should show alert: "Please grant camera/gallery permissions and try again"
   - App does NOT crash
   - Can retry after granting permissions

## Test Scenario 3: User Cancels Camera

1. Follow steps 1-4 above

2. **When camera opens, click Cancel/Back without taking photo**

3. **Expected Result ✅**
   - Return to upload screen
   - No error message (user cancelled intentionally)
   - Can try again

## Test Scenario 4: Upload Other Documents

1. On DriverDocumentUploadScreen, try uploading other documents:
   - Driver License
   - Vehicle Front Photo
   - Insurance Certificate
   - Etc.

2. For most documents, you should see alert with two options:
   - Camera
   - Gallery

3. **Expected Result ✅**
   - Camera uploads work
   - Gallery uploads work
   - All documents process without crashing

## Test Scenario 5: Large Image (Optional)

1. Use a very high-quality image (>5MB)
2. Try to upload

3. **Expected Result ✅**
   - Should show error: "Image too large. Please use a smaller image"
   - Not a crash, but clear message

## Console Output Verification

Open Metro Bundler console or device logs. When uploading DRIVER_SELFIE, you should see logs like:

```
LOG  handleUploadDocument: Starting for DRIVER_SELFIE useCamera: true
LOG  handleUploadDocument: Picking image
LOG  pickDocumentImage: Requesting camera permission
LOG  pickDocumentImage: Launching camera
LOG  pickDocumentImage: User action result - canceled: false
LOG  pickDocumentImage: Asset received - has base64: true, uri: file://...
LOG  pickDocumentImage: Returning image data - base64 length: 145823
LOG  handleUploadDocument: Image picked successfully, size: 145823
LOG  handleUploadDocument: Uploading to database
LOG  uploadDocumentImage: Starting upload for DRIVER_SELFIE driver: 00578898-...
LOG  uploadDocumentImage: Image size: 145823 bytes
LOG  uploadDocumentImage: Preparing upsert
LOG  uploadDocumentImage: Successfully uploaded DRIVER_SELFIE with id: ...
LOG  handleUploadDocument: Upload successful, base64 length: 145823
LOG  handleUploadDocument: Reloading documents
LOG  loadDocuments: Loading documents for driver: 00578898-...
LOG  loadDocuments: Retrieved documents: [...]
LOG  handleUploadDocument: Documents reloaded successfully
```

**NO CRASHES** should appear in the logs

## Success Criteria

- ✅ Selfie uploads without crashing
- ✅ All 9 documents can be uploaded
- ✅ Error messages are clear and user-friendly
- ✅ App stays responsive
- ✅ Console logs show proper flow
- ✅ After all 9 documents uploaded, "Submit for Verification" button is enabled
- ✅ After submit, redirects to WaitingForApprovalScreen

## If Issues Persist

### App still crashes
- Check console for specific error message
- Look for "Error uploading document:" in logs
- Note the exact error message
- Check if `base64: true` is in ImagePicker options

### Base64 not being captured
- Check Expo version compatibility with ImagePicker
- Try upgrading expo-image-picker: `npm install expo-image-picker@latest`
- Check device storage (might not have space for temp images)

### Database error on upload
- Check Supabase RLS policies are correct
- Verify `auth.uid()` is working (check previous fixes in AuthContext)
- Check database `driver_documents` table exists and has correct schema

### Memory issues with large images
- Quality is now 0.6 (reduced from 0.7)
- Max size is 10MB
- If still having issues, reduce quality further or limit max size
