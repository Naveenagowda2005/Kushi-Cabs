# Complete Document Upload Flow - Diagnosis & Fix

## Current Status

**Logs show:**
```
getPendingVerifications: Found 0 drivers with pending documents
No documents found in bucket for driver: a3c7433b-e2d9-4963-b378-30d3996e23af
```

**This means:**
- Documents are NOT in the storage bucket
- OR documents are in bucket but RLS policies block listing/downloading
- Documents are definitely NOT in the `driver_documents` database table

---

## Root Cause Analysis

### Issue 1: Storage Bucket RLS Policies
The `driver-documents` bucket likely has RLS enabled, which may be blocking:
- **Uploads** from the driver app via backend
- **Listing** of files by the admin dashboard
- **Downloading/Viewing** of files

**Migration 103** explicitly mentions this issue needs to be fixed manually.

### Issue 2: Missing Database Records
Even if files are in the bucket, there are NO corresponding records in the `driver_documents` table because:
- Old code didn't create database records (fixed in previous update)
- New code creates records, but app hasn't restarted yet

### Issue 3: Backend Upload Path
The backend uploads to: `drivers/{driverId}/{documentType}.jpg`
But the listing endpoint may be looking in a different path.

---

## Multi-Step Fix

### Step 1: Fix Storage Bucket RLS (CRITICAL)

**In Supabase Dashboard:**

1. Go to **Storage** → **driver-documents** bucket
2. Click on **Settings** tab
3. Look for **RLS** toggle:
   - If **Enabled**: Click to **Disable** (allows anyone to access files via service role key)
   - If **Disabled**: Skip this step (good to go)
4. Repeat for **vendor-documents** and **user-avatars** buckets

**Alternative: Apply SQL policies**
Run the queries in `FIX_STORAGE_BUCKET_RLS.sql` via Supabase SQL Editor to create proper RLS policies.

### Step 2: Restart Mobile App

The updated `documentService.js` needs to be loaded:
```
Force close → Kill app process → Restart app
```

### Step 3: Re-Upload a Document

1. Open driver app
2. Go to **Profile** → **Documents**
3. Upload one test document (e.g., Driver License)
4. **CHECK LOGS** - should see:
   ```
   ✅ Document uploaded: https://...
   📝 Creating database record for document tracking
   📝 Creating new document record
   ```

### Step 4: Verify in Supabase Dashboard

1. Go to **Storage** → **driver-documents**
2. Navigate to `drivers/{driverId}/` folder
3. Should see uploaded files (e.g., `DL.jpg`, `VEHICLE_FRONT.jpg`)

### Step 5: Verify in Database

Run this SQL query:
```sql
SELECT driver_id, document_type, status, uploaded_at 
FROM driver_documents 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'
ORDER BY document_type;
```

Should return rows for each uploaded document.

### Step 6: Check Super Admin Dashboard

1. Super admin app → **Driver Verification** tab
2. Should see driver "Smiling" in pending list
3. Click on driver to see uploaded documents
4. Documents should display with approve/reject buttons

---

## Diagnostic Checklist

**Before uploading:**
- [ ] App restarted after code changes
- [ ] Storage bucket RLS is disabled (or proper policies applied)
- [ ] Driver has correct user ID: `a3c7433b-e2d9-4963-b378-30d3996e23af`

**After uploading a test document:**
- [ ] Check logs for "✅ Document uploaded: https://..."
- [ ] Check logs for "📝 Creating database record"
- [ ] File appears in Storage → driver-documents → drivers/{driverId}/
- [ ] Database record exists: `SELECT * FROM driver_documents WHERE driver_id = '...'`
- [ ] `driver_documents.status = 'pending'`

**For super admin verification:**
- [ ] Super admin role is correctly set (check `roles.name = 'super_admin'`)
- [ ] Super admin RLS policy allows viewing all documents
- [ ] `getPendingVerifications()` returns driver in list
- [ ] Driver card shows pending count (e.g., "1/9")

---

## Specific Logs to Watch

**Driver App - Upload:**
```
✅ Uploaded via Backend API: https://...bucket/drivers/{driverId}/DL.jpg
📝 Creating database record for document tracking
📝 Creating new document record
✅ Successfully uploaded DL to storage bucket and created database record
```

**Driver App - Load Documents:**
```
loadDocuments: Retrieved documents count: 1
loadDocuments: Found uploaded document for DL: https://...
```

**Super Admin App - Load Verifications:**
```
getPendingVerifications: Found 1 drivers with pending documents
getPendingVerifications: Retrieved 1 verification status records
✅ Loaded 1 pending verifications
```

---

## Backend Upload Endpoint Flow

1. **Frontend** sends POST to `/api/upload/upload-document`
   - Headers: `Content-Type: application/json`
   - Body: `{ driverId, documentType, base64Data, fileName }`

2. **Backend** (using service role key):
   - Decodes base64 to buffer
   - Uploads to `driver-documents/drivers/{driverId}/{documentType}.{ext}`
   - Returns public URL

3. **Frontend** (updated):
   - Calls uploadDocumentImage() which now:
   - Uploads file
   - Creates database record with status='pending'
   - Returns URL

---

## If Still Not Working

**Check these:**

1. **Storage credentials** - Backend has correct `SUPABASE_SERVICE_ROLE_KEY`
2. **Bucket name** - Ensure it's exactly `driver-documents` (case-sensitive)
3. **Document types** - Must be exact: DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC, AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE
4. **Backend API endpoint** - Verify `/api/upload/upload-document` exists and is callable
5. **Database tables exist** - Run:
   ```sql
   SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='driver_documents');
   SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='driver_verification_status');
   ```

---

## Timeline After Fix

1. **Immediate** (after restart):
   - Driver uploads documents
   - Files go to bucket
   - Database records created with status='pending'

2. **Same day** (after driver submits):
   - `submitDocumentsForVerification()` changes status to 'pending_review'
   - Super admin sees driver in verification list
   - Super admin can approve/reject each document

3. **After approval**:
   - Document status changes to 'approved'
   - Driver sees green checkmark
   - When all approved, driver sees "All documents approved!" message

---

## Questions to Verify

1. Has the driver app been restarted after the code changes?
   - **What to do:** Force quit app and restart
   
2. Are the storage buckets set up correctly?
   - **What to do:** Check in Supabase Dashboard → Storage section
   
3. Are database tables created?
   - **What to do:** Run diagnostic SQL queries (see above)
   
4. Is the backend API running?
   - **What to do:** Test the endpoint manually with curl or Postman

---

## Success Criteria

✅ Driver uploads document → File appears in bucket within 2 seconds
✅ Database record created with status='pending'
✅ Driver submits all documents → Status changes to 'pending_review'
✅ Super admin sees driver in verification list
✅ Super admin can view and approve/reject documents
✅ Driver sees verification progress update (X/9)
