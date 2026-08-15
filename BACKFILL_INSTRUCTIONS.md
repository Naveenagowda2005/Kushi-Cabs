# Backfill Documents - Quick Fix

## Problem
Documents are in the bucket but no database records exist, so super admin can't see them.

## Solution
Create database records for existing bucket files. Three methods available:

---

## Method 1: SQL Query (Quickest for Single Driver)

**If you know the driver ID and which documents are in bucket:**

1. Go to Supabase Dashboard → SQL Editor
2. Copy the query from `BACKFILL_DRIVER_DOCUMENTS_FROM_BUCKET.sql`
3. Replace `'a3c7433b-e2d9-4963-b378-30d3996e23af'` with actual driver ID
4. Only include document types that are ACTUALLY in the bucket
5. Run the query

**Example:**
```sql
INSERT INTO driver_documents (
  driver_id,
  document_type,
  status,
  uploaded_at,
  created_at,
  updated_at
) VALUES
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'DL', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'VEHICLE_FRONT', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'INSURANCE', 'pending', NOW(), NOW(), NOW())
-- ... add only the document types that exist in bucket
```

**Then create verification status:**
```sql
INSERT INTO driver_verification_status (
  driver_id,
  overall_status,
  all_documents_submitted,
  submitted_at,
  created_at,
  updated_at
) VALUES (
  'a3c7433b-e2d9-4963-b378-30d3996e23af',
  'pending_review',
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (driver_id) DO UPDATE SET
  overall_status = 'pending_review',
  all_documents_submitted = true,
  submitted_at = NOW();
```

---

## Method 2: Programmatic (For Multiple Drivers)

**Use the backfill service from code:**

```javascript
import * as backfillService from '../services/backfillService';

// For ONE driver:
const driverId = 'a3c7433b-e2d9-4963-b378-30d3996e23af';
const docTypes = await backfillService.findDocumentTypesInBucket(driverId);
const result = await backfillService.backfillDriverDocuments(driverId, docTypes);
console.log('Backfill result:', result);

// For ALL drivers:
const summary = await backfillService.backfillAllDrivers();
console.log('Backfill summary:', summary);
```

**Where to run this:**
- Super admin settings screen (add a debug button)
- Developer console
- One-time job/migration script

---

## Method 3: Manual Step-by-Step

### Step 1: Check what's in the bucket

Go to Supabase Dashboard → Storage → driver-documents → drivers/

You'll see folders like:
```
drivers/
  a3c7433b-e2d9-4963-b378-30d3996e23af/
    DL.jpg
    VEHICLE_FRONT.jpg
    INSURANCE.jpg
    FC.jpg
    EMISSION.jpg
    RC.jpg
    AADHAR.jpg
    BANK_PASSBOOK_FRONT.jpg
    DRIVER_SELFIE.jpg
```

Note down which files exist.

### Step 2: Run SQL to backfill

For driver `a3c7433b-e2d9-4963-b378-30d3996e23af` with files DL, VEHICLE_FRONT, INSURANCE:

```sql
-- Check if records exist
SELECT * FROM driver_documents 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';

-- If no results, insert them:
INSERT INTO driver_documents (driver_id, document_type, status, uploaded_at, created_at, updated_at) 
VALUES 
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'DL', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'VEHICLE_FRONT', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'INSURANCE', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'FC', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'EMISSION', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'RC', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'AADHAR', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'BANK_PASSBOOK_FRONT', 'pending', NOW(), NOW(), NOW()),
  ('a3c7433b-e2d9-4963-b378-30d3996e23af', 'DRIVER_SELFIE', 'pending', NOW(), NOW(), NOW());

-- Verify
SELECT * FROM driver_documents 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'
ORDER BY document_type;
```

### Step 3: Create verification status

```sql
INSERT INTO driver_verification_status (
  driver_id, overall_status, all_documents_submitted, submitted_at, created_at, updated_at
) VALUES (
  'a3c7433b-e2d9-4963-b378-30d3996e23af', 'pending_review', true, NOW(), NOW(), NOW()
)
ON CONFLICT (driver_id) DO UPDATE SET
  overall_status = 'pending_review',
  all_documents_submitted = true,
  submitted_at = NOW();

-- Verify
SELECT * FROM driver_verification_status 
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af';
```

### Step 4: Test

1. Refresh super admin app
2. Go to Driver Verification tab
3. Driver should now appear in the list
4. Click on driver to see uploaded documents
5. Should be able to approve/reject

---

## Verification Checklist

After backfill:

- [ ] Database records created: `SELECT * FROM driver_documents WHERE driver_id = '...'` returns 9 rows
- [ ] Verification status created: `SELECT * FROM driver_verification_status WHERE driver_id = '...'` returns 1 row
- [ ] Status is 'pending_review': Both tables show correct status
- [ ] Files exist in bucket: Storage dashboard shows files
- [ ] Super admin sees driver in verification list
- [ ] Super admin can view documents with approval buttons

---

## For Future Uploads

Going forward (after app restart with the fix):

1. Driver uploads document → File goes to bucket + database record created automatically
2. Driver submits → Status changes to 'pending_review'
3. Super admin sees driver in list → Can approve/reject
4. NO manual backfill needed

The backfill is a one-time operation to fix the existing documents that were uploaded before the fix was deployed.

---

## Important Notes

⚠️ **Only insert records for documents that ACTUALLY exist in bucket**
- If you insert a record but no file exists, it will show as pending but fail to display

⚠️ **Document type names are case-sensitive**
- Valid types: DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC, AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE

⚠️ **Driver ID must be a valid user ID from users table**
- Get valid IDs from: `SELECT id, phone FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'driver');`

⚠️ **After SQL changes, restart both apps**
- Driver app: See updated document status
- Super admin app: See driver in verification list
