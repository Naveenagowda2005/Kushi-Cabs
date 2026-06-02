# Driver Verification System - Quick Reference

## Quick Start

### Required Documents (6 total)
- `DL` - Driver's License
- `VEHICLE_FRONT` - Vehicle Front Photo
- `INSURANCE` - Insurance Certificate
- `FC` - Fitness Certificate
- `EMISSION` - Emission Certificate
- `RC` - Registration Certificate

### Status Values
- **pending**: Awaiting verification
- **approved**: Verified and approved
- **rejected**: Rejected by admin
- **not_started**: No documents uploaded

---

## Common Operations

### 1. Upload/Update a Document
```sql
INSERT INTO driver_documents (driver_id, document_type, document_url)
VALUES ('driver-uuid', 'DL', 'https://storage.url/document.pdf')
ON CONFLICT (driver_id, document_type) 
DO UPDATE SET 
  document_url = EXCLUDED.document_url,
  uploaded_at = NOW(),
  status = 'pending',
  rejection_reason = NULL,
  verified_by = NULL,
  verified_at = NULL;
```

### 2. Approve a Document
```sql
UPDATE driver_documents
SET status = 'approved',
    verified_by = 'admin-uuid',
    verified_at = NOW()
WHERE id = 'document-uuid';
```

### 3. Reject a Document
```sql
UPDATE driver_documents
SET status = 'rejected',
    rejection_reason = 'Document is blurry',
    verified_by = 'admin-uuid',
    verified_at = NOW()
WHERE id = 'document-uuid';
```

### 4. Get Driver's Verification Status
```sql
SELECT * FROM driver_verification_status
WHERE driver_id = 'driver-uuid';
```

### 5. Get All Documents for a Driver
```sql
SELECT * FROM driver_documents
WHERE driver_id = 'driver-uuid'
ORDER BY document_type;
```

### 6. Get Drivers Pending Verification
```sql
SELECT u.id, u.full_name, u.phone, dvs.overall_status
FROM users u
JOIN driver_verification_status dvs ON u.id = dvs.driver_id
WHERE dvs.overall_status = 'pending'
ORDER BY dvs.submitted_at;
```

### 7. Get Approved Drivers
```sql
SELECT u.id, u.full_name, u.phone, dvs.approved_at
FROM users u
JOIN driver_verification_status dvs ON u.id = dvs.driver_id
WHERE dvs.overall_status = 'approved'
ORDER BY dvs.approved_at DESC;
```

### 8. Get Rejected Drivers
```sql
SELECT u.id, u.full_name, u.phone, dvs.rejection_reason, dvs.rejected_at
FROM users u
JOIN driver_verification_status dvs ON u.id = dvs.driver_id
WHERE dvs.overall_status = 'rejected'
ORDER BY dvs.rejected_at DESC;
```

### 9. Get Documents Pending Verification
```sql
SELECT dd.id, dd.driver_id, u.full_name, dd.document_type, dd.uploaded_at
FROM driver_documents dd
JOIN users u ON dd.driver_id = u.id
WHERE dd.status = 'pending'
ORDER BY dd.uploaded_at;
```

### 10. Get Driver's Verification Summary
```sql
SELECT 
  u.id,
  u.full_name,
  u.phone,
  dvs.overall_status,
  dvs.all_documents_submitted,
  COUNT(CASE WHEN dd.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN dd.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN dd.status = 'rejected' THEN 1 END) as rejected_count
FROM driver_verification_status dvs
JOIN users u ON dvs.driver_id = u.id
LEFT JOIN driver_documents dd ON dvs.driver_id = dd.driver_id
WHERE dvs.driver_id = 'driver-uuid'
GROUP BY u.id, dvs.id;
```

---

## Automatic Behavior

✅ **Automatically Handled by Triggers:**

1. When first document uploaded → `driver_verification_status` record created
2. When all 6 documents uploaded → `all_documents_submitted` = true, `submitted_at` set
3. When document status changes → overall status recalculated
4. When all documents approved → `overall_status` = approved, `approved_at` set
5. When any document rejected → `overall_status` = rejected, `rejected_at` set
6. When verification status changes → `users.verification_status` synced

---

## Table Relationships

```
users (id)
  ├── driver_documents (driver_id)
  │   └── verified_by (FK to users.id - super admin)
  └── driver_verification_status (driver_id)
```

---

## Key Indexes

For optimal query performance:
- `idx_driver_documents_driver_id` - Query documents by driver
- `idx_driver_documents_status` - Filter by verification status
- `idx_driver_verification_status_overall_status` - Filter drivers by status
- `idx_users_verification_status` - Filter users by verification status

---

## Important Notes

⚠️ **Remember:**
- One document per driver per type (UNIQUE constraint)
- All 6 document types required for full approval
- Any rejected document sets overall status to rejected
- Documents can be re-uploaded after rejection
- All timestamps are UTC (TIMESTAMPTZ)
- `verified_by` tracks which admin verified each document

---

## Troubleshooting

### Driver status not updating?
Check if the trigger `trg_update_overall_verification_status` is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_update_overall_verification_status';
```

### Document not appearing in list?
Verify the document exists and check the driver_id:
```sql
SELECT * FROM driver_documents WHERE driver_id = 'driver-uuid';
```

### Verification status out of sync?
Manually trigger the sync:
```sql
UPDATE driver_verification_status 
SET updated_at = NOW() 
WHERE driver_id = 'driver-uuid';
```

---

## Migration Commands

Apply migrations in order:
```bash
# Apply migration 037
psql -d your_database -f 037_driver_documents_verification.sql

# Apply migration 038
psql -d your_database -f 038_add_verification_status_to_users.sql
```

Or via Supabase CLI:
```bash
supabase migration up
```
