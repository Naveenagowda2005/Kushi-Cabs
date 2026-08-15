# Driver Document Verification System

## Overview

This document describes the SQL schema for the driver document verification system. The system manages the upload, verification, and approval of driver documents required for onboarding.

## Database Schema

### Tables

#### 1. `driver_documents`
Stores individual driver documents with their verification status.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `driver_id` (UUID, FK → users.id): Reference to the driver
- `document_type` (ENUM): Type of document
  - `DL`: Driver's License
  - `VEHICLE_FRONT`: Vehicle Front Photo
  - `INSURANCE`: Insurance Certificate
  - `FC`: Fitness Certificate
  - `EMISSION`: Emission Certificate
  - `RC`: Registration Certificate
- `document_url` (TEXT): Path/URL to the uploaded file
- `uploaded_at` (TIMESTAMPTZ): When the document was uploaded
- `status` (ENUM): Verification status
  - `pending`: Awaiting verification
  - `approved`: Document verified and approved
  - `rejected`: Document rejected
- `rejection_reason` (TEXT, nullable): Reason for rejection if rejected
- `verified_by` (UUID, FK → users.id, nullable): Super admin who verified
- `verified_at` (TIMESTAMPTZ, nullable): When verification was completed
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints:**
- UNIQUE(driver_id, document_type): One document per driver per type
- Foreign key to users table for driver_id
- Foreign key to users table for verified_by (super admin)

**Indexes:**
- `idx_driver_documents_driver_id`: Query documents by driver
- `idx_driver_documents_status`: Query by verification status
- `idx_driver_documents_document_type`: Query by document type
- `idx_driver_documents_verified_by`: Query by verifying admin
- `idx_driver_documents_uploaded_at`: Query by upload date
- `idx_driver_documents_driver_type`: Composite index for driver + type

---

#### 2. `driver_verification_status`
Tracks overall verification status for each driver across all required documents.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `driver_id` (UUID, FK → users.id, UNIQUE): Reference to the driver
- `overall_status` (ENUM): Overall verification status
  - `pending`: Some documents approved, some pending
  - `approved`: All documents approved
  - `rejected`: One or more documents rejected
- `all_documents_submitted` (BOOLEAN): True when all 6 required documents uploaded
- `submitted_at` (TIMESTAMPTZ, nullable): When all documents were submitted
- `approved_at` (TIMESTAMPTZ, nullable): When driver was fully approved
- `rejected_at` (TIMESTAMPTZ, nullable): When driver was rejected
- `rejection_reason` (TEXT, nullable): Overall rejection reason
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints:**
- UNIQUE(driver_id): One record per driver
- Foreign key to users table for driver_id

**Indexes:**
- `idx_driver_verification_status_driver_id`: Query by driver
- `idx_driver_verification_status_overall_status`: Query by status
- `idx_driver_verification_status_submitted_at`: Query by submission date
- `idx_driver_verification_status_approved_at`: Query by approval date

---

#### 3. `users` (Modified)
Added verification_status column to track driver verification state.

**New Column:**
- `verification_status` (TEXT): Driver verification status
  - `not_started`: No documents uploaded yet
  - `pending`: Documents submitted, awaiting verification
  - `approved`: Driver fully verified and approved
  - `rejected`: Driver verification rejected

**New Index:**
- `idx_users_verification_status`: Query users by verification status

---

### Enums

#### `driver_document_type`
```sql
CREATE TYPE driver_document_type AS ENUM (
  'DL',              -- Driver's License
  'VEHICLE_FRONT',   -- Vehicle Front Photo
  'INSURANCE',       -- Insurance Certificate
  'FC',              -- Fitness Certificate
  'EMISSION',        -- Emission Certificate
  'RC'               -- Registration Certificate
);
```

#### `verification_status`
```sql
CREATE TYPE verification_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);
```

---

## Triggers and Automation

### 1. `trg_driver_documents_updated_at`
Automatically updates the `updated_at` timestamp whenever a document record is modified.

### 2. `trg_driver_verification_status_updated_at`
Automatically updates the `updated_at` timestamp whenever a verification status record is modified.

### 3. `trg_create_verification_status`
When a driver uploads their first document, automatically creates a `driver_verification_status` record.

### 4. `trg_check_all_documents_submitted`
When a document is uploaded or updated, checks if all 6 required documents have been submitted and updates `all_documents_submitted` flag and `submitted_at` timestamp.

### 5. `trg_update_overall_verification_status`
When a document status changes, recalculates the overall verification status:
- If any document is rejected → overall status = `rejected`
- If all 6 documents are approved → overall status = `approved`
- Otherwise → overall status = `pending`

Also updates `approved_at` and `rejected_at` timestamps accordingly.

### 6. `trg_sync_user_verification_status`
Syncs the verification status from `driver_verification_status` to the `users` table:
- `approved` → `approved`
- `rejected` → `rejected`
- All documents submitted → `pending`
- Otherwise → `not_started`

---

## Common Queries

### Get all documents for a driver
```sql
SELECT * FROM driver_documents
WHERE driver_id = $1
ORDER BY document_type;
```

### Get drivers pending verification
```sql
SELECT u.*, dvs.overall_status, dvs.all_documents_submitted
FROM users u
JOIN driver_verification_status dvs ON u.id = dvs.driver_id
WHERE dvs.overall_status = 'pending'
ORDER BY dvs.submitted_at;
```

### Get approved drivers
```sql
SELECT u.*, dvs.approved_at
FROM users u
JOIN driver_verification_status dvs ON u.id = dvs.driver_id
WHERE dvs.overall_status = 'approved'
ORDER BY dvs.approved_at DESC;
```

### Get rejected drivers with reasons
```sql
SELECT u.*, dvs.rejection_reason, dvs.rejected_at
FROM users u
JOIN driver_verification_status dvs ON u.id = dvs.driver_id
WHERE dvs.overall_status = 'rejected'
ORDER BY dvs.rejected_at DESC;
```

### Get documents pending verification
```sql
SELECT dd.*, u.full_name, u.phone
FROM driver_documents dd
JOIN users u ON dd.driver_id = u.id
WHERE dd.status = 'pending'
ORDER BY dd.uploaded_at;
```

### Get documents verified by a specific admin
```sql
SELECT dd.*, u.full_name
FROM driver_documents dd
JOIN users u ON dd.driver_id = u.id
WHERE dd.verified_by = $1
ORDER BY dd.verified_at DESC;
```

### Get drivers missing specific documents
```sql
SELECT DISTINCT u.id, u.full_name, u.phone
FROM users u
WHERE u.id NOT IN (
  SELECT driver_id FROM driver_documents 
  WHERE document_type = 'DL'
)
AND u.verification_status != 'not_started';
```

---

## API Operations

### Upload a Document
```sql
INSERT INTO driver_documents (driver_id, document_type, document_url)
VALUES ($1, $2, $3)
ON CONFLICT (driver_id, document_type) 
DO UPDATE SET 
  document_url = $3,
  uploaded_at = NOW(),
  status = 'pending',
  rejection_reason = NULL,
  verified_by = NULL,
  verified_at = NULL;
```

### Approve a Document
```sql
UPDATE driver_documents
SET status = 'approved',
    verified_by = $1,  -- super admin id
    verified_at = NOW()
WHERE id = $2;
```

### Reject a Document
```sql
UPDATE driver_documents
SET status = 'rejected',
    rejection_reason = $1,
    verified_by = $2,  -- super admin id
    verified_at = NOW()
WHERE id = $3;
```

### Get Driver Verification Summary
```sql
SELECT 
  dvs.driver_id,
  u.full_name,
  u.phone,
  dvs.overall_status,
  dvs.all_documents_submitted,
  COUNT(CASE WHEN dd.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN dd.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN dd.status = 'rejected' THEN 1 END) as rejected_count,
  dvs.submitted_at,
  dvs.approved_at,
  dvs.rejected_at
FROM driver_verification_status dvs
JOIN users u ON dvs.driver_id = u.id
LEFT JOIN driver_documents dd ON dvs.driver_id = dd.driver_id
WHERE dvs.driver_id = $1
GROUP BY dvs.id, u.id;
```

---

## Migration Files

Two migration files are provided:

1. **037_driver_documents_verification.sql**
   - Creates `driver_documents` table
   - Creates `driver_verification_status` table
   - Creates enums: `driver_document_type`, `verification_status`
   - Creates all indexes and triggers

2. **038_add_verification_status_to_users.sql**
   - Adds `verification_status` column to `users` table
   - Creates index on `verification_status`
   - Creates trigger to sync status from `driver_verification_status`

---

## Data Flow

1. **Driver uploads document**
   - Document inserted into `driver_documents` with status = `pending`
   - If first document, `driver_verification_status` record created
   - `users.verification_status` updated to `not_started` or `pending`

2. **Super admin verifies document**
   - Document status updated to `approved` or `rejected`
   - `verified_by` and `verified_at` set
   - Overall status recalculated

3. **All documents approved**
   - `driver_verification_status.overall_status` = `approved`
   - `driver_verification_status.approved_at` set
   - `users.verification_status` = `approved`

4. **Any document rejected**
   - `driver_verification_status.overall_status` = `rejected`
   - `driver_verification_status.rejected_at` set
   - `users.verification_status` = `rejected`

---

## Notes

- The system requires all 6 document types to be submitted for full verification
- Rejection of any document sets overall status to rejected
- Documents can be re-uploaded after rejection
- All timestamps are in UTC (TIMESTAMPTZ)
- The `verified_by` field tracks which super admin verified each document
- Automatic triggers handle status synchronization and calculations
