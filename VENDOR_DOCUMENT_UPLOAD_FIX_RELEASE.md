# 🔧 Vendor Document Upload Fix - Release Notes

## Issue Summary
Vendor documents were not persisting to the database even though upload appeared successful. Logs showed:
- Upload success alert displayed
- Console showed "INSERT/UPDATE successful"  
- But documents list still showed `document_data: null` after reload

## Root Causes Identified

### 1. **Document Data Not Being Preserved in JSONB**
The `vendor_documents` table stores documents as JSONB. The frontend was saving the data, but something was causing it to be null when retrieved.

### 2. **Missing Initialize of Document Structure**
When creating a new vendor_documents record, only the uploaded document was being saved. Other documents weren't initialized, causing potential structure issues.

### 3. **Insufficient Debugging**
Previous implementation lacked detailed logging of the JSONB structure and data persistence flow.

## Changes Applied

### Frontend: `VendorDocumentUploadScreen.js`

#### 1. **Enhanced INSERT Logic**
```javascript
// Now initializes ALL document types before saving
const currentDocs = {};
REQUIRED_DOCUMENTS.forEach(docType => {
  currentDocs[docType] = {
    status: 'pending',
    document_data: null,
    uploaded_at: null,
  };
});
// Then update the one being uploaded
currentDocs[documentType] = {
  status: 'pending',
  document_data: imageData.base64,
  uploaded_at: new Date().toISOString(),
};
```

#### 2. **Enhanced UPDATE Logic**
- Improved logging of document keys before/after update
- Verify base64 data is not empty
- Log returned data structure from database

#### 3. **Enhanced loadDocuments() Function**
- Log retrieved document types
- Log individual document status and data presence
- More robust error handling for missing records

### Added Detailed Logging

**Upload Flow:**
```
handleUploadDocument: Starting upload for user: [ID] Vendor ID: [ID]
handleUploadDocument: Image picked successfully, size: [BYTES]
handleUploadDocument: No existing record, creating new one
handleUploadDocument: INSERT payload with keys: [AADHAR, PAN_CARD, ...]
handleUploadDocument: Payload size: [BYTES]
handleUploadDocument: INSERT SUCCESS - returned documents keys: [KEYS]
```

**Load Flow:**
```
loadDocuments: Starting load for user: [ID]
loadDocuments: Retrieved document types: [TYPES]
loadDocuments: AADHAR - status: pending, has data: true
loadDocuments: PAN_CARD - status: pending, has data: true
loadDocuments: Final list: [details]
```

## Testing Procedure

### Test 1: Initial Document Upload
1. **Action:** Vendor uploads AADHAR card
2. **Expected:**
   - Success alert appears
   - Console shows INSERT with all 4 document types initialized
   - Console shows document keys in returned data
   - Refresh screen → document appears with status "pending"

3. **Verify Logs:**
```
handleUploadDocument: INSERT payload with keys: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
handleUploadDocument: INSERT SUCCESS - returned documents keys: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
```

### Test 2: Second Document Upload
1. **Action:** Vendor uploads PAN card (existing record should UPDATE)
2. **Expected:**
   - Success alert appears
   - Console shows UPDATE with all 4 document types
   - Both AADHAR and PAN_CARD have data
   - Progress bar shows 2/4

3. **Verify Logs:**
```
handleUploadDocument: Current document keys before update: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
handleUploadDocument: Updated PAN_CARD status: pending, data length: [BYTES]
handleUploadDocument: UPDATE returned documents with keys: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
handleUploadDocument: Verify PAN_CARD has data: true
```

### Test 3: All Documents Uploaded
1. **Action:** Upload all 4 documents
2. **Expected:**
   - Progress bar reaches 4/4
   - "Submit for Verification" button appears
   - All documents show "pending" status

### Test 4: Submit for Verification
1. **Action:** Click "Submit for Verification"
2. **Expected:**
   - Success alert: "Documents submitted for verification"
   - Navigator to "WaitingForApproval" screen
   - Database shows `vendor_verification_status.overall_status = 'pending'`

### Test 5: Real-time Approval Update
1. **Setup:** Admin approval in backend
2. **Expected:**
   - Vendor polling detects status change
   - Real-time listener triggers (if available)
   - "Approved!" alert appears
   - Auto-navigate to vendor dashboard

## Database Query to Verify

```sql
-- Check if documents are actually saved
SELECT 
  vd.user_id,
  vd.vendor_id,
  jsonb_object_keys(vd.documents) as document_types,
  vd.documents->'AADHAR'->>'status' as aadhar_status,
  LENGTH(vd.documents->'AADHAR'->>'document_data') as aadhar_data_size,
  vd.created_at,
  vd.updated_at
FROM vendor_documents vd
WHERE vd.user_id = 'USER_ID';

-- Should show all 4 document types with non-null status
```

## Rollback Instructions

If issues occur:

1. **Stop app**
2. **Revert to previous version:**
   ```bash
   git revert HEAD
   npm install  # in newtaxi/apps/unified
   ```
3. **Clear app data and restart**

## Troubleshooting

### Issue: Still seeing `document_data: null`

**Check 1: Is data being sent?**
```javascript
// Look for this log:
handleUploadDocument: Image picked successfully, size: [SHOULD BE > 0]
```
If size is 0, image picker issue.

**Check 2: Is INSERT/UPDATE returning?**
```javascript
// Look for success indicator:
handleUploadDocument: INSERT SUCCESS
// or
handleUploadDocument: UPDATE returned documents with keys
```
If not returning, database error.

**Check 3: Is loadDocuments being called?**
```javascript
// After upload, should see:
loadDocuments: Starting load for user
```

**Check 4: Is JSONB structure correct?**
```javascript
// Should show all keys:
loadDocuments: Retrieved document types: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
```

### Issue: Upload appears to work but document disappears on refresh

**Solution:**
1. Check browser console for errors
2. Verify loadDocuments completes without errors
3. Check database directly for document presence
4. Confirm RLS policies allow SELECT for user

### Issue: Can't upload first document (INSERT fails)

**Solution:**
1. Verify vendor_id is set correctly
2. Check RLS policy: `vendors_upload_documents`
3. Confirm user_id in token matches request
4. Check that vendor exists in vendors table

## Commits

```
✅ [Latest] Enhanced vendor document upload with detailed JSONB logging
   - Initialize all document types on first upload
   - Improved logging for upload/load flow
   - Better error handling and verification
   - Database structure preserved across operations
```

## Deployment Checklist

- [ ] App reloaded successfully
- [ ] Test upload of first document
- [ ] Check console for initialization of all 4 document types
- [ ] Refresh page and verify document persists
- [ ] Upload second document
- [ ] Verify both documents appear
- [ ] Upload all 4 documents
- [ ] Submit for verification
- [ ] Check database shows correct structure
- [ ] Test admin approval flow
- [ ] Verify real-time update works

## Related Documentation

- `VENDOR_DOCUMENT_UPLOAD_FINAL_STATUS.md` - Debugging guide
- `VENDOR_APPROVAL_DEBUG_GUIDE.md` - Admin approval workflow
- Migration `051_vendor_documents_verification.sql` - Table schema
- Migration `052_vendor_verification_rls_policies.sql` - RLS policies

---

**Status:** Ready for testing  
**Severity:** Medium (affects vendor onboarding)  
**Backwards Compatible:** Yes  
**Requires DB Migration:** No (existing schema)
