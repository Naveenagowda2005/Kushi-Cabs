# Driver Verification System - Data Model & Diagrams

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS TABLE                             │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ phone (TEXT, UNIQUE)                                            │
│ full_name (TEXT)                                                │
│ role_id (INTEGER, FK → roles)                                   │
│ is_active (BOOLEAN)                                             │
│ verification_status (TEXT) ← NEW COLUMN                         │
│ created_at (TIMESTAMPTZ)                                        │
└─────────────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │                                    │
         │ driver_id                          │ verified_by
         │                                    │
    ┌────┴──────────────────────────────────┴────┐
    │                                             │
    │                                             │
┌───┴──────────────────────────────────────────┐ │
│      DRIVER_DOCUMENTS TABLE                  │ │
├────────────────────────────────────────────┐ │ │
│ id (UUID, PK)                              │ │ │
│ driver_id (UUID, FK → users) ──────────────┼─┘ │
│ document_type (ENUM)                       │   │
│ document_url (TEXT)                        │   │
│ uploaded_at (TIMESTAMPTZ)                  │   │
│ status (ENUM)                              │   │
│ rejection_reason (TEXT, nullable)          │   │
│ verified_by (UUID, FK → users) ────────────┼───┘
│ verified_at (TIMESTAMPTZ, nullable)        │
│ created_at (TIMESTAMPTZ)                   │
│ updated_at (TIMESTAMPTZ)                   │
│ UNIQUE(driver_id, document_type)           │
└────────────────────────────────────────────┘
         ▲
         │ driver_id
         │
┌────────┴──────────────────────────────────────┐
│  DRIVER_VERIFICATION_STATUS TABLE             │
├───────────────────────────────────────────────┤
│ id (UUID, PK)                                 │
│ driver_id (UUID, FK → users, UNIQUE)          │
│ overall_status (ENUM)                         │
│ all_documents_submitted (BOOLEAN)             │
│ submitted_at (TIMESTAMPTZ, nullable)          │
│ approved_at (TIMESTAMPTZ, nullable)           │
│ rejected_at (TIMESTAMPTZ, nullable)           │
│ rejection_reason (TEXT, nullable)             │
│ created_at (TIMESTAMPTZ)                      │
│ updated_at (TIMESTAMPTZ)                      │
└───────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Upload Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ DRIVER UPLOADS DOCUMENT                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ File uploaded to │
                    │ storage bucket   │
                    └──────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ INSERT INTO driver_documents             │
        │ - driver_id                              │
        │ - document_type                          │
        │ - document_url                           │
        │ - status = 'pending'                     │
        │ - uploaded_at = NOW()                    │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ TRIGGER: create_verification_status     │
        │ (if first document)                      │
        │ → INSERT INTO driver_verification_status│
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ TRIGGER: check_all_documents_submitted  │
        │ → Check if all 6 documents uploaded      │
        │ → Update all_documents_submitted flag    │
        │ → Set submitted_at timestamp             │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ TRIGGER: update_overall_verification    │
        │ → Recalculate overall_status             │
        │ → Update users.verification_status       │
        └─────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Document ready   │
                    │ for verification │
                    └──────────────────┘
```

### Verification Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN VERIFIES DOCUMENT                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │   APPROVE    │    │   REJECT     │
            └──────────────┘    └──────────────┘
                    │                   │
                    ▼                   ▼
        ┌─────────────────────┐ ┌──────────────────┐
        │ UPDATE driver_docs  │ │ UPDATE driver_docs
        │ - status='approved' │ │ - status='rejected'
        │ - verified_by=admin │ │ - verified_by=admin
        │ - verified_at=NOW() │ │ - verified_at=NOW()
        │                     │ │ - rejection_reason
        └─────────────────────┘ └──────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ TRIGGER: update_overall_verification    │
        │ Recalculate overall_status:             │
        │ - If any rejected → 'rejected'           │
        │ - If all approved → 'approved'           │
        │ - Otherwise → 'pending'                  │
        └─────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  APPROVED    │    │  REJECTED    │
            │ Set approved │    │ Set rejected │
            │ _at = NOW()  │    │ _at = NOW()  │
            └──────────────┘    └──────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ TRIGGER: sync_user_verification_status  │
        │ → Update users.verification_status      │
        │ → Send notification to driver           │
        └─────────────────────────────────────────┘
```

---

## Status State Machine

```
                    ┌─────────────────┐
                    │  NOT_STARTED    │
                    │ (no documents)  │
                    └────────┬────────┘
                             │
                    (driver uploads docs)
                             │
                             ▼
                    ┌─────────────────┐
                    │    PENDING      │
                    │ (awaiting admin) │
                    └────────┬────────┘
                             │
                    (admin verifies)
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │  APPROVED    │  │  REJECTED    │
            │ (all docs ok)│  │ (any doc bad)│
            └──────────────┘  └──────────────┘
                    ▲                 │
                    │                 │
                    │        (driver re-uploads)
                    │                 │
                    └─────────────────┘
```

---

## Document Type Enum

```
driver_document_type
├── DL (Driver's License)
├── VEHICLE_FRONT (Vehicle Front Photo)
├── INSURANCE (Insurance Certificate)
├── FC (Fitness Certificate)
├── EMISSION (Emission Certificate)
└── RC (Registration Certificate)

Total Required: 6 documents
```

---

## Verification Status Enum

```
verification_status
├── pending (awaiting verification)
├── approved (verified and approved)
└── rejected (rejected by admin)
```

---

## User Verification Status Values

```
users.verification_status
├── not_started (no documents uploaded)
├── pending (documents submitted, awaiting verification)
├── approved (driver fully verified)
└── rejected (verification rejected)
```

---

## Index Strategy

### driver_documents Indexes
```
1. idx_driver_documents_driver_id
   → Query: WHERE driver_id = ?
   → Use: Get all documents for a driver

2. idx_driver_documents_status
   → Query: WHERE status = 'pending'
   → Use: Get pending documents

3. idx_driver_documents_document_type
   → Query: WHERE document_type = 'DL'
   → Use: Get specific document type

4. idx_driver_documents_verified_by
   → Query: WHERE verified_by = ?
   → Use: Get documents verified by admin

5. idx_driver_documents_uploaded_at
   → Query: WHERE uploaded_at > ?
   → Use: Get recently uploaded documents

6. idx_driver_documents_driver_type
   → Query: WHERE driver_id = ? AND document_type = ?
   → Use: Get specific document for driver
```

### driver_verification_status Indexes
```
1. idx_driver_verification_status_driver_id
   → Query: WHERE driver_id = ?
   → Use: Get verification status for driver

2. idx_driver_verification_status_overall_status
   → Query: WHERE overall_status = 'pending'
   → Use: Get drivers by verification status

3. idx_driver_verification_status_submitted_at
   → Query: WHERE submitted_at > ?
   → Use: Get recently submitted verifications

4. idx_driver_verification_status_approved_at
   → Query: WHERE approved_at > ?
   → Use: Get recently approved drivers
```

### users Indexes
```
1. idx_users_verification_status
   → Query: WHERE verification_status = 'approved'
   → Use: Get approved drivers
```

---

## Trigger Execution Order

When a document is uploaded:
```
1. trg_driver_documents_updated_at
   └─ Updates updated_at timestamp

2. trg_create_verification_status
   └─ Creates driver_verification_status record (if first doc)

3. trg_check_all_documents_submitted
   └─ Checks if all 6 documents submitted
   └─ Updates all_documents_submitted flag
   └─ Sets submitted_at timestamp

4. trg_update_overall_verification_status
   └─ Recalculates overall_status
   └─ Updates approved_at or rejected_at

5. trg_sync_user_verification_status
   └─ Syncs status to users.verification_status
```

When a document is verified:
```
1. trg_driver_documents_updated_at
   └─ Updates updated_at timestamp

2. trg_update_overall_verification_status
   └─ Recalculates overall_status
   └─ Updates approved_at or rejected_at

3. trg_sync_user_verification_status
   └─ Syncs status to users.verification_status
```

---

## Query Performance Analysis

### Fast Queries (< 1ms)
```sql
-- Get driver's documents
SELECT * FROM driver_documents WHERE driver_id = ?
-- Uses: idx_driver_documents_driver_id

-- Get pending documents
SELECT * FROM driver_documents WHERE status = 'pending'
-- Uses: idx_driver_documents_status

-- Get driver's verification status
SELECT * FROM driver_verification_status WHERE driver_id = ?
-- Uses: idx_driver_verification_status_driver_id
```

### Medium Queries (1-10ms)
```sql
-- Get pending verifications with driver info
SELECT * FROM driver_verification_status dvs
JOIN users u ON dvs.driver_id = u.id
WHERE dvs.overall_status = 'pending'
-- Uses: idx_driver_verification_status_overall_status

-- Get documents with driver info
SELECT * FROM driver_documents dd
JOIN users u ON dd.driver_id = u.id
WHERE dd.status = 'pending'
-- Uses: idx_driver_documents_status
```

### Slow Queries (> 10ms)
```sql
-- Get all drivers with document counts
SELECT u.id, COUNT(dd.id) as doc_count
FROM users u
LEFT JOIN driver_documents dd ON u.id = dd.driver_id
GROUP BY u.id
-- Recommendation: Add materialized view or cache
```

---

## Storage Considerations

### File Storage Structure
```
driver-documents/
├── {driver_id}/
│   ├── DL/
│   │   └── {timestamp}_{filename}
│   ├── VEHICLE_FRONT/
│   │   └── {timestamp}_{filename}
│   ├── INSURANCE/
│   │   └── {timestamp}_{filename}
│   ├── FC/
│   │   └── {timestamp}_{filename}
│   ├── EMISSION/
│   │   └── {timestamp}_{filename}
│   └── RC/
│       └── {timestamp}_{filename}
```

### Storage Limits
- Max file size: 10MB per document
- Max total per driver: 60MB (6 × 10MB)
- Supported formats: PDF, JPG, PNG, JPEG

---

## Concurrency Handling

### Conflict Resolution
```sql
-- Upsert on document upload (handles re-upload)
INSERT INTO driver_documents (driver_id, document_type, document_url)
VALUES (?, ?, ?)
ON CONFLICT (driver_id, document_type)
DO UPDATE SET
  document_url = EXCLUDED.document_url,
  uploaded_at = NOW(),
  status = 'pending',
  rejection_reason = NULL,
  verified_by = NULL,
  verified_at = NULL;
```

### Lock Strategy
- Row-level locks on document updates
- No table-level locks needed
- Triggers handle consistency

---

## Backup & Recovery

### Critical Tables
1. driver_documents - Contains document records
2. driver_verification_status - Contains verification status
3. users - Contains verification_status column

### Backup Strategy
```sql
-- Backup driver_documents
CREATE TABLE driver_documents_backup AS
SELECT * FROM driver_documents;

-- Backup driver_verification_status
CREATE TABLE driver_verification_status_backup AS
SELECT * FROM driver_verification_status;
```

### Recovery Strategy
```sql
-- Restore from backup
TRUNCATE driver_documents CASCADE;
INSERT INTO driver_documents SELECT * FROM driver_documents_backup;

TRUNCATE driver_verification_status CASCADE;
INSERT INTO driver_verification_status SELECT * FROM driver_verification_status_backup;
```

---

## Scalability Considerations

### Current Capacity
- Supports 1M+ drivers
- Supports 6M+ documents
- Supports 1M+ concurrent verifications

### Optimization Opportunities
1. Partition driver_documents by driver_id
2. Archive old documents to cold storage
3. Use materialized views for dashboards
4. Implement caching layer (Redis)
5. Use read replicas for reporting

### Growth Projections
- 1,000 drivers → ~6,000 documents
- 10,000 drivers → ~60,000 documents
- 100,000 drivers → ~600,000 documents
- 1,000,000 drivers → ~6,000,000 documents

---

## Security Model

### Access Control Matrix

```
                    | Driver | Admin | System
────────────────────┼────────┼───────┼────────
View own docs       |   ✓    |   ✓   |   ✓
View all docs       |   ✗    |   ✓   |   ✓
Upload own docs     |   ✓    |   ✗   |   ✓
Verify docs         |   ✗    |   ✓   |   ✓
Update status       |   ✗    |   ✓   |   ✓
Delete docs         |   ✗    |   ✗   |   ✗
```

### RLS Policies
- Drivers: Can only access own documents
- Admins: Can access all documents
- System: Can update via triggers
- No one can delete documents (audit trail)

---

## Monitoring Metrics

### Key Performance Indicators
```
1. Documents uploaded per day
2. Average verification time
3. Rejection rate
4. Approval rate
5. Pending verifications count
6. Database query performance
7. Storage usage
8. API response times
```

### Alerts to Set Up
```
- Pending verifications > 100
- Rejection rate > 20%
- Average verification time > 24 hours
- Database query time > 1 second
- Storage usage > 80%
- API response time > 500ms
```

---

## Version Control

### Schema Versioning
```
Migration 037: Initial schema (v1.0)
Migration 038: Add users column (v1.0)
Migration 039: Add RLS policies (v1.0)
```

### Rollback Strategy
```sql
-- Rollback migration 039
DROP POLICY IF EXISTS ... ON driver_documents;
DROP POLICY IF EXISTS ... ON driver_verification_status;

-- Rollback migration 038
ALTER TABLE users DROP COLUMN verification_status;

-- Rollback migration 037
DROP TABLE driver_documents CASCADE;
DROP TABLE driver_verification_status CASCADE;
DROP TYPE driver_document_type;
DROP TYPE verification_status;
```
