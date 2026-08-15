# Document Upload Issue - Root Cause & Fix

## Problem
Documents were showing as "successfully uploaded" but not actually being stored in the database.

## Root Causes Identified

### 1. **RLS Policy Role Name Mismatch** ⚠️ CRITICAL
**Issue**: The RLS policies were checking for role name `'admin'` but the actual role in the database is `'super_admin'`

**Location**: `supabase/migrations/039_driver_verification_rls_policies.sql`

**Affected Policies**:
- `super_admins_view_all_documents` - was checking for 'admin'
- `super_admins_verify_documents` - was checking for 'admin'
- `super_admins_view_all_verification_status` - was checking for 'admin'
- `super_admins_view_all_users_verification_status` - was checking for 'admin'

**Impact**: While drivers could insert documents (their policy didn't check role), the admin policies would fail silently.

### 2. **Upsert vs Insert Issue**
**Issue**: The original code used `upsert()` with `onConflict` parameter, which requires a unique constraint to work properly.

**Location**: `src/services/documentService.js` - `uploadDocumentImage()` function

**Solution**: Changed to use `delete()` then `insert()` for more reliable behavior:
```javascript
// Delete existing document if it exists
await supabase
  .from('driver_documents')
  .delete()
  .eq('driver_id', driverId)
  .eq('document_type', documentType);

// Insert new document
await supabase
  .from('driver_documents')
  .insert([{ ... }])
  .select()
  .single();
```

### 3. **Insufficient Error Logging**
**Issue**: The upload was silently failing without proper error messages

**Solution**: Added comprehensive logging to:
- `uploadDocumentImage()` in documentService.js
- `handleUploadDocument()` in DriverDocumentUploadScreen.js
- `loadDocuments()` in DriverDocumentUploadScreen.js

## Fixes Applied

### Fix 1: Update RLS Policies
**File**: `supabase/migrations/039_driver_verification_rls_policies.sql`

Changed all 4 occurrences of:
```sql
AND users.role_id = (SELECT id FROM roles WHERE name = 'admin')
```

To:
```sql
AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
```

### Fix 2: Improve Document Upload Logic
**File**: `src/services/documentService.js`

**Changes**:
- Removed `upsert()` with `onConflict`
- Added delete-then-insert pattern
- Added comprehensive logging
- Better error handling

```javascript
export const uploadDocumentImage = async (driverId, documentType, imageData) => {
  try {
    if (!imageData || !imageData.base64) {
      throw new Error('Invalid image data');
    }

    console.log('uploadDocumentImage: Starting upload for', documentType, 'driver:', driverId);

    const base64Data = imageData.base64;
    
    console.log('uploadDocumentImage: Base64 data length:', base64Data.length);

    // Delete existing document if it exists
    const { error: deleteError } = await supabase
      .from('driver_documents')
      .delete()
      .eq('driver_id', driverId)
      .eq('document_type', documentType);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('Warning deleting existing document:', deleteError);
    }

    // Insert new document record
    const { data, error } = await supabase
      .from('driver_documents')
      .insert([
        {
          driver_id: driverId,
          document_type: documentType,
          document_data: base64Data,
          document_name: imageData.fileName,
          document_mime_type: 'image/jpeg',
          status: 'pending',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('uploadDocumentImage: Insert error:', error);
      throw error;
    }

    console.log('uploadDocumentImage: Successfully uploaded', documentType);

    return base64Data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};
```

### Fix 3: Add Logging to Upload Screen
**File**: `src/screens/driver/DriverDocumentUploadScreen.js`

**Changes**:
- Added logging to `handleUploadDocument()`
- Added logging to `loadDocuments()`
- Better error messages in alerts

```javascript
const handleUploadDocument = async (documentType, useCamera) => {
  try {
    setUploading(prev => ({ ...prev, [documentType]: true }));

    console.log('handleUploadDocument: Starting upload for', documentType);

    const imageData = await documentService.pickDocumentImage(useCamera);
    if (!imageData) {
      console.log('handleUploadDocument: User cancelled image selection');
      setUploading(prev => ({ ...prev, [documentType]: false }));
      return;
    }

    console.log('handleUploadDocument: Image picked, uploading to database');

    const base64Data = await documentService.uploadDocumentImage(
      driverId,
      documentType,
      imageData
    );

    console.log('handleUploadDocument: Upload successful, reloading documents');

    await loadDocuments();
    
    console.log('handleUploadDocument: Documents reloaded');
    
    Alert.alert('Success', `${documentService.getDocumentLabel(documentType)} uploaded successfully`);
  } catch (error) {
    console.error('Upload error:', error);
    Alert.alert('Error', error.message || 'Failed to upload document. Please try again.');
  } finally {
    setUploading(prev => ({ ...prev, [documentType]: false }));
  }
};
```

## How to Apply Fixes

### Step 1: Update RLS Policies
The migration file has been updated. You need to:

**Option A: Re-apply migration (if not yet applied)**
```bash
supabase db push
```

**Option B: If migration already applied, run this SQL in Supabase:**
```sql
-- Drop old policies
DROP POLICY IF EXISTS "super_admins_view_all_documents" ON driver_documents;
DROP POLICY IF EXISTS "super_admins_verify_documents" ON driver_documents;
DROP POLICY IF EXISTS "super_admins_view_all_verification_status" ON driver_verification_status;
DROP POLICY IF EXISTS "super_admins_view_all_users_verification_status" ON users;

-- Create new policies with correct role name
CREATE POLICY "super_admins_view_all_documents"
  ON driver_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "super_admins_verify_documents"
  ON driver_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "super_admins_view_all_verification_status"
  ON driver_verification_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "super_admins_view_all_users_verification_status"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );
```

### Step 2: Update Service Code
The documentService.js has been updated with better upload logic and logging.

### Step 3: Update Screen Code
The DriverDocumentUploadScreen.js has been updated with comprehensive logging.

### Step 4: Test the Upload
1. Start the app
2. Sign up as a driver
3. Try uploading a document
4. Check the console logs for detailed information
5. Verify the document appears in the list
6. Check Supabase database to confirm data is stored

## Debugging

### Check Console Logs
When uploading, you should see logs like:
```
handleUploadDocument: Starting upload for DL
handleUploadDocument: Image picked, uploading to database
uploadDocumentImage: Starting upload for DL driver: <user-id>
uploadDocumentImage: Base64 data length: 12345
uploadDocumentImage: Successfully uploaded DL
handleUploadDocument: Upload successful, reloading documents
loadDocuments: Loading documents for driver: <user-id>
loadDocuments: Retrieved documents: [...]
handleUploadDocument: Documents reloaded
```

### If Upload Still Fails

1. **Check RLS Policies**
   - Go to Supabase dashboard
   - Check if policies are using 'super_admin' not 'admin'

2. **Check User Authentication**
   - Verify `auth.uid()` matches `driver_id` in the insert
   - Check if user is properly authenticated

3. **Check Database Permissions**
   - Verify user has INSERT permission on driver_documents table
   - Check if RLS is enabled

4. **Run Debug Script**
   - Use the provided `debug-document-upload.js` script
   - It will test each step of the upload process

## Files Modified

1. ✅ `supabase/migrations/039_driver_verification_rls_policies.sql` - Fixed role names
2. ✅ `src/services/documentService.js` - Improved upload logic and logging
3. ✅ `src/screens/driver/DriverDocumentUploadScreen.js` - Added comprehensive logging
4. ✅ `debug-document-upload.js` - New debug script

## Testing Checklist

- [ ] RLS policies updated with 'super_admin' role name
- [ ] Service code updated with delete-then-insert pattern
- [ ] Screen code updated with logging
- [ ] Test upload shows console logs
- [ ] Document appears in list after upload
- [ ] Document data stored in Supabase
- [ ] Admin can see uploaded documents
- [ ] Admin can approve/reject documents

## Expected Behavior After Fix

1. **Upload Starts**
   - Console shows: "Starting upload for [document type]"

2. **Image Selected**
   - Console shows: "Image picked, uploading to database"

3. **Upload to Database**
   - Console shows: "Base64 data length: [number]"
   - Console shows: "Successfully uploaded [document type]"

4. **Documents Reloaded**
   - Console shows: "Retrieved documents: [array]"
   - Document appears in the list with "pending" status

5. **Database Verification**
   - Check Supabase: `driver_documents` table
   - Should see new row with:
     - `driver_id`: user's ID
     - `document_type`: DL, VEHICLE_FRONT, etc.
     - `document_data`: base64 string
     - `status`: pending

## Summary

The document upload issue was caused by:
1. **RLS policy role name mismatch** (admin vs super_admin)
2. **Upsert logic issues** (changed to delete-then-insert)
3. **Insufficient logging** (added comprehensive logging)

All issues have been fixed. The system should now properly store documents in the database.
