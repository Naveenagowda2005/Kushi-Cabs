# Migration 043: Add 3 New Document Types

## Status: Ready to Apply

This migration adds 3 new document types to the driver verification system:
- **AADHAR** - Aadhar ID
- **BANK_PASSBOOK_FRONT** - Bank Passbook Front Photo  
- **DRIVER_SELFIE** - Driver Selfie (camera capture)

## What's Changing
- Total documents increased from 6 to 9
- New enum values added to `driver_document_type`
- Database triggers updated to require 9 documents
- Service layer already updated to handle 9 documents
- UI updated to display 9 documents with camera capture for DRIVER_SELFIE

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy the SQL from: `supabase/migrations/043_add_new_document_types.sql`
5. Click **Run**
6. Verify success (should see "Database modified" message)

### Option 2: Using Supabase CLI
```bash
supabase db push
```

## Verification After Migration

Run this query to verify the new enum values exist:
```sql
SELECT enum_range(NULL::driver_document_type);
```

You should see output including: `AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE`

## Code Updates Already Completed ✅

### Frontend Changes:
- ✅ `documentService.js`:
  - Updated `getDocumentLabel()` to include new document labels
  - Updated `getDocumentIcon()` to include new document icons
  - Updated `areAllDocumentsApproved()` to require 9 documents
  - Updated `getDocumentSummary()` to count 9 documents total

- ✅ `DriverDocumentUploadScreen.js`:
  - Updated `REQUIRED_DOCUMENTS` array from 6 to 9 documents
  - Progress bar now shows progress toward 9 documents
  - All 9 documents display in the upload list

- ✅ `DocumentUploadCard.js`:
  - DRIVER_SELFIE automatically uses camera (no gallery option)
  - Other documents show camera/gallery choice dialog
  - Proper icons and labels for all documents

## What Happens After Migration

1. **New Driver Signup**: Will need to upload all 9 documents
2. **Existing Drivers**: Can continue verification process with any previously uploaded documents
3. **Database**: Triggers will enforce 9 documents needed for complete verification
4. **UI**: Will automatically show all 9 documents to drivers

## Rollback Plan (if needed)

If you need to rollback:
1. Create a reverse migration that changes enum back to 6 types
2. This is only needed if something breaks - the migration is designed to be safe

---

**Next Steps After Migration:**
1. Test driver signup flow with new 9-document requirement
2. Verify camera capture works for DRIVER_SELFIE
3. Test admin verification dashboard with all 9 documents
4. Verify driver can't submit documents until all 9 are uploaded
