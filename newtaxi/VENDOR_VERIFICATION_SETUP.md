# Vendor Verification System - Setup Guide

## Step 1: Run Database Migration

Execute the migration file in your Supabase SQL editor:

```bash
supabase/migrations/051_vendor_documents_verification.sql
```

This creates:
- `vendor_documents` table
- `vendor_verification_status` table  
- Document type enums
- Triggers for syncing verification status

## Step 2: Create Supabase Storage Bucket

Create a new storage bucket for vendor documents:

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `vendor-documents`
3. Make it public (allow public access)
4. Set CORS policy to allow your app domain

```sql
-- Bucket creation (done via UI or API):
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', true);
```

## Step 3: Verify RLS Policies

If using RLS, ensure vendor-documents bucket allows authenticated users to upload:

```sql
CREATE POLICY "Users can upload vendor documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'vendor-documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can read vendor documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vendor-documents');
```

## Step 4: Test the Flow

### Test Vendor Signup:
1. Open app as new vendor
2. Complete phone verification
3. Fill profile (Name, Business Name)
4. Upload 4 documents:
   - Aadhar Card
   - PAN Card
   - Bank Passbook (Front)
   - Selfie with Aadhar
5. Click "Submit for Verification"
6. Should see "Waiting for Approval" screen

### Test Super Admin Approval:
1. Login as super admin
2. Go to "Vendor Verif" tab
3. See pending vendor application
4. Review documents by tapping thumbnails
5. Either approve or reject with reason
6. Vendor should see update within 5 seconds

## Step 5: Post-Approval

Once approved, vendor:
- Sees "Account Approved" notification
- Redirected to vendor dashboard
- Can create trip enquiries
- Full access to all vendor features

## Database Schema

### vendor_documents
```
- id (UUID) - Primary key
- vendor_id (UUID) - Reference to vendors.id
- user_id (UUID) - Reference to users.id
- documents (JSONB) - Stores all doc types
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

Document JSON structure:
```json
{
  "AADHAR": {
    "status": "pending",
    "document_url": "https://...",
    "document_data": "base64...",
    "uploaded_at": "2024-01-01T00:00:00Z",
    "rejection_reason": null
  },
  "PAN_CARD": {...},
  "BANK_PASSBOOK_FRONT": {...},
  "VENDOR_SELFIE": {...}
}
```

### vendor_verification_status
```
- id (UUID) - Primary key
- vendor_id (UUID) - Reference to vendors.id
- user_id (UUID) - Reference to users.id
- overall_status (TEXT) - not_started, pending, approved, rejected
- all_documents_submitted (BOOLEAN)
- submitted_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- rejected_at (TIMESTAMP)
- rejection_reason (TEXT)
- verified_by (UUID) - Super admin who verified
- verified_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Status Sync

The trigger `sync_vendor_verification_status()` automatically updates `users.verification_status`:

| vendor_verification_status | → | users.verification_status |
|---|---|---|
| not_started | → | not_started |
| pending* | → | pending |
| approved | → | approved |
| rejected | → | rejected |

*When all_documents_submitted = true

## Troubleshooting

### Vendor can't upload documents
- Check Supabase Storage bucket exists and is public
- Verify RLS policies allow authenticated users
- Check browser console for upload errors

### Vendor not seeing waiting screen
- Check vendor_verification_status record exists
- Verify user_id in status matches auth user ID
- Check browser console for fetch errors

### Super admin can't see vendors
- Verify super admin role is correct
- Check vendor_verification_status records have pending status
- Verify documents were stored in vendor_documents

### Status not updating for vendor
- Check trigger exists: `trg_sync_vendor_verification_status`
- Verify update to vendor_verification_status succeeds
- Check users table verification_status column exists

## API Integration (if needed)

If you want to trigger notifications when vendor is approved:

1. Create webhook in vendor_verification_status:
   ```sql
   SELECT pg_net.http_post(
     url:='https://your-backend/webhooks/vendor-approved',
     body:=jsonb_build_object('vendor_id', NEW.vendor_id, 'status', NEW.overall_status)
   ) WHERE NEW.overall_status = 'approved';
   ```

2. Send email/SMS notification to vendor email/phone

## Cleanup (if removing)

To remove vendor verification system:

```sql
-- Drop trigger
DROP TRIGGER trg_sync_vendor_verification_status ON vendor_verification_status;
DROP FUNCTION sync_vendor_verification_status();

-- Drop tables
DROP TABLE vendor_verification_status;
DROP TABLE vendor_documents;

-- Drop enum
DROP TYPE vendor_document_type;

-- Delete storage bucket
-- Via Supabase UI → Storage → Delete bucket
```

## Next Steps

1. Run the migration
2. Create storage bucket
3. Deploy app with new screens
4. Test full vendor signup flow
5. Have super admin approve test vendors
6. Monitor logs for any issues
