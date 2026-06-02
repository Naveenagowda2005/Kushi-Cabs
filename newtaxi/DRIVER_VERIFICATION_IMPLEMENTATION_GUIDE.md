# Driver Verification System - Implementation Guide

## Overview

This guide walks through implementing the driver document verification system in your taxi application.

## Files Created

### 1. Migration Files (in `supabase/migrations/`)

#### `037_driver_documents_verification.sql`
- Creates `driver_documents` table
- Creates `driver_verification_status` table
- Creates enums: `driver_document_type`, `verification_status`
- Creates all indexes for optimal query performance
- Creates 6 triggers for automatic status management

#### `038_add_verification_status_to_users.sql`
- Adds `verification_status` column to `users` table
- Creates index on `verification_status`
- Creates trigger to sync status from `driver_verification_status`

#### `039_driver_verification_rls_policies.sql`
- Enables RLS on verification tables
- Creates policies for drivers (view/upload own documents)
- Creates policies for super admins (view/verify all documents)
- Ensures data security and proper access control

### 2. Documentation Files

- `DRIVER_VERIFICATION_SYSTEM.md` - Complete schema documentation
- `DRIVER_VERIFICATION_QUICK_REFERENCE.md` - Quick lookup guide
- `DRIVER_VERIFICATION_API_EXAMPLES.md` - API endpoint examples
- `DRIVER_VERIFICATION_IMPLEMENTATION_GUIDE.md` - This file

---

## Step-by-Step Implementation

### Step 1: Apply Migrations

```bash
# Navigate to your project
cd /path/to/newtaxi

# Apply migrations using Supabase CLI
supabase migration up

# Or manually apply via psql
psql -d your_database -f supabase/migrations/037_driver_documents_verification.sql
psql -d your_database -f supabase/migrations/038_add_verification_status_to_users.sql
psql -d your_database -f supabase/migrations/039_driver_verification_rls_policies.sql
```

### Step 2: Verify Schema

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('driver_documents', 'driver_verification_status');

-- Check columns added to users
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'verification_status';

-- Check enums created
SELECT typname FROM pg_type 
WHERE typname IN ('driver_document_type', 'verification_status');
```

### Step 3: Create Backend API Endpoints

Create the following endpoints in your backend:

**Driver Endpoints:**
- `POST /api/driver/documents/upload` - Upload document
- `GET /api/driver/documents` - Get all documents
- `GET /api/driver/verification-status` - Get verification status

**Admin Endpoints:**
- `GET /api/admin/verifications/pending` - Get pending verifications
- `POST /api/admin/documents/:id/approve` - Approve document
- `POST /api/admin/documents/:id/reject` - Reject document
- `GET /api/admin/drivers/approved` - Get approved drivers
- `GET /api/admin/drivers/rejected` - Get rejected drivers
- `GET /api/admin/verifications/stats` - Get dashboard stats

See `DRIVER_VERIFICATION_API_EXAMPLES.md` for implementation details.

### Step 4: Create Frontend Components

**Driver App Components:**
- Document upload form (with file picker)
- Document list view (showing status)
- Verification status dashboard
- Rejection reason display

**Admin Dashboard Components:**
- Pending verifications list
- Document viewer/preview
- Approve/Reject buttons
- Verification statistics dashboard
- Approved/Rejected drivers lists

### Step 5: Configure Storage

Set up Supabase Storage bucket for documents:

```javascript
// Create bucket
const { data, error } = await supabase.storage.createBucket('driver-documents', {
  public: true,
  fileSizeLimit: 10485760 // 10MB
});

// Set up RLS policies for storage
// Allow drivers to upload to their own folder
// Allow admins to view all documents
```

### Step 6: Set Up Notifications

Create notification system for:
- Driver: Document approved/rejected
- Admin: New documents pending verification
- Driver: All documents approved

```javascript
// Example: Send notification when document rejected
const { error } = await supabase
  .from('notifications')
  .insert({
    user_id: driver_id,
    type: 'document_rejected',
    title: 'Document Rejected',
    message: `Your ${document_type} has been rejected: ${rejection_reason}`,
    data: { document_id, document_type }
  });
```

### Step 7: Add Email Notifications

```javascript
// Send email when document rejected
await sendEmail({
  to: driver_email,
  subject: 'Document Verification - Action Required',
  template: 'document_rejected',
  data: {
    driver_name,
    document_type,
    rejection_reason,
    reupload_link: `${APP_URL}/driver/documents/upload`
  }
});

// Send email when all documents approved
await sendEmail({
  to: driver_email,
  subject: 'Verification Complete - Welcome!',
  template: 'verification_approved',
  data: {
    driver_name,
    approved_at: new Date()
  }
});
```

---

## Database Schema Summary

### Tables

```
driver_documents
├── id (UUID, PK)
├── driver_id (UUID, FK → users)
├── document_type (ENUM: DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC)
├── document_url (TEXT)
├── status (ENUM: pending, approved, rejected)
├── rejection_reason (TEXT, nullable)
├── verified_by (UUID, FK → users, nullable)
├── verified_at (TIMESTAMPTZ, nullable)
├── uploaded_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

driver_verification_status
├── id (UUID, PK)
├── driver_id (UUID, FK → users, UNIQUE)
├── overall_status (ENUM: pending, approved, rejected)
├── all_documents_submitted (BOOLEAN)
├── submitted_at (TIMESTAMPTZ, nullable)
├── approved_at (TIMESTAMPTZ, nullable)
├── rejected_at (TIMESTAMPTZ, nullable)
├── rejection_reason (TEXT, nullable)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

users (modified)
└── verification_status (TEXT: not_started, pending, approved, rejected)
```

### Automatic Triggers

1. **trg_driver_documents_updated_at** - Updates timestamp on document change
2. **trg_driver_verification_status_updated_at** - Updates timestamp on status change
3. **trg_create_verification_status** - Creates status record on first document upload
4. **trg_check_all_documents_submitted** - Checks if all 6 documents submitted
5. **trg_update_overall_verification_status** - Recalculates overall status
6. **trg_sync_user_verification_status** - Syncs status to users table

---

## Key Features

✅ **Automatic Status Management**
- Triggers automatically calculate overall verification status
- No manual status updates needed

✅ **Document Tracking**
- Track who verified each document
- Track when verification happened
- Store rejection reasons

✅ **Comprehensive Audit Trail**
- All timestamps recorded
- Admin who verified tracked
- Status change history available

✅ **Security**
- RLS policies enforce access control
- Drivers can only see/upload their own documents
- Admins can verify all documents

✅ **Performance**
- Optimized indexes for common queries
- Efficient status calculations
- Minimal database overhead

---

## Common Workflows

### Workflow 1: Driver Uploads Documents

1. Driver uploads document via app
2. Document inserted with status = `pending`
3. Trigger creates `driver_verification_status` record (if first document)
4. Trigger checks if all 6 documents submitted
5. `users.verification_status` updated to `pending` (if all submitted)

### Workflow 2: Admin Verifies Document

1. Admin views pending documents
2. Admin approves/rejects document
3. Trigger recalculates overall status
4. If all approved → overall_status = `approved`, `users.verification_status` = `approved`
5. If any rejected → overall_status = `rejected`, `users.verification_status` = `rejected`

### Workflow 3: Driver Re-uploads Rejected Document

1. Driver sees rejection reason
2. Driver re-uploads document
3. Document status reset to `pending`
4. Trigger recalculates overall status back to `pending`
5. Admin can verify again

---

## Testing Checklist

- [ ] Migrations apply without errors
- [ ] Tables created with correct columns
- [ ] Enums created correctly
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Triggers fire correctly
- [ ] Document upload works
- [ ] Status calculations work
- [ ] Admin can approve/reject
- [ ] Overall status updates correctly
- [ ] User verification_status syncs
- [ ] Rejection reason stored
- [ ] Verified_by tracks admin
- [ ] Timestamps recorded correctly

---

## Performance Considerations

### Query Optimization

```sql
-- Use indexes for common queries
EXPLAIN ANALYZE
SELECT * FROM driver_documents 
WHERE driver_id = 'uuid' 
AND status = 'pending';

-- Use composite indexes
EXPLAIN ANALYZE
SELECT * FROM driver_documents 
WHERE driver_id = 'uuid' 
AND document_type = 'DL';
```

### Caching Strategy

- Cache verification status for 5 minutes
- Cache document list for 2 minutes
- Invalidate on upload/verification
- Use Redis for caching

### Batch Operations

```sql
-- Approve multiple documents
UPDATE driver_documents
SET status = 'approved',
    verified_by = $1,
    verified_at = NOW()
WHERE id = ANY($2::uuid[])
AND status = 'pending';
```

---

## Troubleshooting

### Issue: Verification status not updating

**Solution:**
```sql
-- Check if trigger is enabled
SELECT * FROM pg_trigger 
WHERE tgname = 'trg_update_overall_verification_status';

-- Manually trigger update
UPDATE driver_verification_status 
SET updated_at = NOW() 
WHERE driver_id = 'uuid';
```

### Issue: Documents not appearing

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'driver_documents';

-- Verify user has access
SELECT * FROM driver_documents 
WHERE driver_id = 'uuid';
```

### Issue: Status out of sync

**Solution:**
```sql
-- Resync all statuses
UPDATE driver_verification_status dvs
SET overall_status = CASE 
  WHEN (SELECT COUNT(*) FROM driver_documents 
        WHERE driver_id = dvs.driver_id 
        AND status = 'rejected') > 0 THEN 'rejected'::verification_status
  WHEN (SELECT COUNT(*) FROM driver_documents 
        WHERE driver_id = dvs.driver_id 
        AND status = 'approved') = 6 THEN 'approved'::verification_status
  ELSE 'pending'::verification_status
END;
```

---

## Security Considerations

1. **File Upload Security**
   - Validate file types
   - Scan for malware
   - Limit file size
   - Use secure storage

2. **Access Control**
   - RLS policies enforce access
   - Drivers can only access own documents
   - Admins can access all documents

3. **Data Privacy**
   - Encrypt sensitive data
   - Audit all access
   - Comply with regulations

4. **API Security**
   - Validate all inputs
   - Use HTTPS only
   - Rate limit endpoints
   - Implement CORS properly

---

## Monitoring

### Key Metrics to Track

- Documents uploaded per day
- Average verification time
- Rejection rate
- Approval rate
- Pending verifications count

### Queries for Monitoring

```sql
-- Documents uploaded today
SELECT COUNT(*) FROM driver_documents 
WHERE DATE(uploaded_at) = CURRENT_DATE;

-- Average verification time
SELECT AVG(EXTRACT(EPOCH FROM (verified_at - uploaded_at))/3600) as avg_hours
FROM driver_documents 
WHERE verified_at IS NOT NULL;

-- Rejection rate
SELECT 
  COUNT(CASE WHEN status = 'rejected' THEN 1 END)::float / COUNT(*) * 100 as rejection_rate
FROM driver_documents;
```

---

## Next Steps

1. Apply migrations to your database
2. Create backend API endpoints
3. Build frontend components
4. Set up file storage
5. Configure notifications
6. Test thoroughly
7. Deploy to production
8. Monitor and optimize

---

## Support

For issues or questions:
1. Check `DRIVER_VERIFICATION_QUICK_REFERENCE.md`
2. Review `DRIVER_VERIFICATION_API_EXAMPLES.md`
3. Check database logs
4. Review RLS policies
5. Verify triggers are enabled

---

## Version History

- **v1.0** (2024-01-15) - Initial implementation
  - 6 document types
  - Automatic status management
  - RLS policies
  - Complete audit trail
