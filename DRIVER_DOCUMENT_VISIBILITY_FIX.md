# Driver Document Visibility Fix

## Problem Summary

After a driver uploads all documents to the bucket and submits them:
1. **Super Admin Verification Screen** shows no documents to approve
2. **Driver Card** shows "pending 0/9" instead of listing uploaded documents

## Root Cause

The `uploadDocumentImage()` function only uploaded files to the **storage bucket** but did NOT create corresponding database records in the `driver_documents` table.

**Flow that was broken:**
```
Driver uploads image → Stored in bucket ✅
                    → Database record NOT created ❌
                    ↓
Super Admin looks for documents → Queries database ❌ (nothing found)
                                → Shows 0/9 pending
```

## Solution Applied

**File Modified**: `apps/unified/src/services/documentService.js`

**Change**: Enhanced `uploadDocumentImage()` to:
1. Upload file to storage bucket (existing behavior)
2. **NEW**: Check if database record exists for this driver + document type
3. **NEW**: Create new record if not exists, or update existing record
4. **NEW**: Set status to `'pending'` so documents appear in verification queue

**New Flow:**
```
Driver uploads image → Stored in bucket ✅
                    → Database record created ✅
                    ↓
Super Admin queries → Finds pending documents ✅
                   → Shows documents with "pending_review" status
                   → Can now approve/reject
                   ↓
Driver card shows → Pending count updates (1/9, 2/9, etc.) ✅
```

## What This Fixes

✅ **Super Admin Dashboard**: Documents now appear in the verification screen
✅ **Approve/Reject UI**: Super admin can now approve or reject each document
✅ **Pending Counter**: Driver card shows correct "X/9" pending count
✅ **Document Tracking**: Database records track upload time and verification status

## Database Flow

When a driver uploads a document:
1. File goes to: `driver-documents/drivers/{driverId}/{documentType}.jpg`
2. Database record created in: `driver_documents` table
   - `driver_id`: Driver's user ID
   - `document_type`: DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC, AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE
   - `status`: 'pending' (waiting for super admin review)
   - `uploaded_at`: Timestamp of upload

## Document Status Flow

1. **pending** → Driver uploaded, waiting for review
2. **pending_review** → Driver submitted all docs for verification
3. **approved** → Super admin approved the document
4. **rejected** → Super admin rejected (driver can re-upload)

## Testing Steps

1. **Driver App**:
   - Go to Profile → Documents
   - Upload all 9 required documents
   - Verify "X/9" counter increases after each upload
   - Submit all documents

2. **Super Admin App**:
   - Go to Dashboard → Driver Verification tab
   - Should see driver card with "pending_review" status
   - Click on driver to view all uploaded documents
   - Approve or reject each document

3. **Verify Database**:
   ```sql
   SELECT driver_id, document_type, status, uploaded_at 
   FROM driver_documents 
   WHERE driver_id = 'driver-uuid'
   ORDER BY document_type;
   ```

## Deployment

- No database migrations needed (tables already exist)
- No RLS policy changes needed
- Frontend-only fix to `documentService.js`
- Restart the mobile app to load the changes

## Notes

- Error handling: If database write fails, the file is still successfully uploaded
- Logs show detailed info about document creation/update
- Existing documents can be re-uploaded (upsert behavior maintained)
