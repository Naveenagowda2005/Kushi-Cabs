# ✅ Vendor Verification System - Complete Implementation

## Overview
Vendors now go through the same approval workflow as drivers. They must upload required documents (Aadhar, PAN Card, Bank Passbook, Selfie) and wait for super admin approval before accessing the dashboard.

---

## Complete Vendor Flow

### 1. Vendor Sign-Up
- Select "Vendor" role
- Enter phone → receive OTP
- Verify OTP
- Fill registration form (Name, Business Name)

### 2. Document Upload (VendorDocumentUploadScreen)
- Upload 4 required documents:
  - Aadhar Card
  - PAN Card
  - Bank Passbook (Front Page)
  - Selfie (Camera only)
- Progress bar shows completion (e.g., "2 of 4 documents uploaded")
- Camera/Gallery options for each document
- Submit button enabled only when all 4 documents uploaded

### 3. Submit for Verification
- Click "Submit for Verification"
- Creates `vendor_verification_status` record with status='pending'
- Redirects to VendorWaitingForApprovalScreen

### 4. Waiting Screen (VendorWaitingForApprovalScreen)
- Shows verification status timeline
- Polls database every 5 seconds for approval status
- "Upload Documents" button allows updating documents anytime
- "Contact Support" button
- "Sign Out" button
- No flickering (only shows loading on initial load, not on polls)

### 5. Admin Review (AdminVendorVerificationDashboard)
- Super admin views pending vendors
- Reviews uploaded documents
- Can approve or reject with reason
- Approval updates verification_status to 'approved'

### 6. Login After Approval
- Vendor logs in
- VendorNavigator checks verification_status
- If 'approved' → shows dashboard
- If 'pending'/'rejected'/'not_started' → shows waiting screen

---

## Database Schema

### vendor_documents Table
```
- id (UUID, Primary Key)
- vendor_id (UUID, UNIQUE, FK to vendors)
- user_id (UUID, FK to users)
- documents (JSONB) - stores all 4 document records
  {
    "AADHAR": { status, document_url, document_data, uploaded_at },
    "PAN_CARD": { status, document_url, document_data, uploaded_at },
    "BANK_PASSBOOK_FRONT": { ... },
    "VENDOR_SELFIE": { ... }
  }
- created_at, updated_at (TIMESTAMPTZ)
```

### vendor_verification_status Table
```
- id (UUID, Primary Key)
- vendor_id (UUID, UNIQUE, FK to vendors)
- user_id (UUID, UNIQUE, FK to users)
- overall_status (TEXT) - 'not_started' | 'pending' | 'approved' | 'rejected'
- all_documents_submitted (BOOLEAN)
- submitted_at (TIMESTAMPTZ)
- approved_at (TIMESTAMPTZ)
- rejected_at (TIMESTAMPTZ)
- rejection_reason (TEXT)
- verified_by (UUID, FK to users)
- verified_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

### Trigger
Syncs vendor verification status to users.verification_status column for quick queries.

---

## Key Implementation Files

### Navigation
- **VendorNavigator.js** - Main vendor navigation
  - Checks verification_status on mount
  - Shows waiting screen if not 'approved'
  - Shows dashboard if 'approved'
  - Includes VendorDocumentUploadScreen for document updates

### Screens
- **VendorDocumentUploadScreen.js** - Document upload interface
  - Handles camera/gallery selection
  - Uses documentService for image picking
  - Uploads to Supabase Storage
  - Stores base64 in vendor_documents JSONB
  - Submits verification record

- **VendorWaitingForApprovalScreen.js** - Approval waiting
  - Polls every 5 seconds (silently, no loading indicator)
  - Shows timeline of verification progress
  - "Upload Documents" button to update docs
  - Auto-detects approval and navigates to dashboard

- **AdminVendorVerificationDashboard.js** - Admin review
  - Lists pending/approved/rejected vendors
  - Shows vendor info and documents
  - Approve/Reject buttons
  - Rejection reason input

### Components
- **DocumentUploadCard.js** - Reusable document upload card
  - Handles camera for selfies (VENDOR_SELFIE)
  - Handles camera/gallery for documents
  - Shows upload status and progress

### Services
- **documentService.js** - Image handling
  - `pickDocumentImage(useCamera)` - picks image with permissions
  - Returns base64, uri, type, fileName
  - Handles permissions gracefully

---

## Status Enum Values
- **not_started** - Vendor hasn't uploaded documents yet
- **pending** - Documents submitted, waiting for admin review
- **approved** - Admin approved, vendor can access dashboard
- **rejected** - Admin rejected, vendor can resubmit documents

---

## Migration
**File**: `supabase/migrations/051_vendor_documents_verification.sql`

Status: ✅ Successfully run in Supabase

Tables created:
- vendor_documents
- vendor_verification_status

Enum created:
- vendor_document_type (AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE)

Trigger created:
- sync_vendor_verification_status (updates users.verification_status)

---

## Testing Checklist

- [ ] Sign up as vendor
- [ ] Verify phone with OTP
- [ ] Fill registration form
- [ ] See 4 required document cards
- [ ] Upload Aadhar (camera or gallery)
- [ ] Upload PAN Card (camera or gallery)
- [ ] Upload Bank Passbook (camera or gallery)
- [ ] Upload Selfie (camera only)
- [ ] Progress bar shows "4 of 4"
- [ ] Submit button is enabled
- [ ] Click submit → success alert
- [ ] Redirected to waiting screen
- [ ] Waiting screen shows timeline
- [ ] "Upload Documents" button visible
- [ ] Poll happens silently every 5 seconds (no UI flicker)
- [ ] Admin approves vendor in dashboard
- [ ] Vendor sees approval notification (or logs out/in to see dashboard)

---

## Known Behaviors

1. **Navigation Context**: VendorDocumentUploadScreen is shown from VendorNavigator (not AuthNavigator) because the user already has a profile after registration completes.

2. **Polling**: The waiting screen polls every 5 seconds without showing a loading indicator. Only shows loading on initial page load.

3. **Document Storage**: Documents are stored as base64 in JSONB field for easy document management and verification.

4. **Vendor ID Required**: Documents require a valid vendor_id from vendors table. This is created during registration.

---

## Completed Tasks

✅ Database migration with vendor_documents and vendor_verification_status tables  
✅ VendorDocumentUploadScreen with 4-document upload  
✅ VendorWaitingForApprovalScreen with polling and timeline  
✅ AdminVendorVerificationDashboard for super admin review  
✅ VendorNavigator logic to check verification status  
✅ Document upload with camera/gallery  
✅ Fixed navigation routing  
✅ Fixed foreign key ambiguity in admin dashboard queries  
✅ Removed UI flickering in waiting screen  
✅ Added "Upload Documents" button to waiting screen  

---

## Future Enhancements (Optional)

- [ ] Email notifications when vendor is approved/rejected
- [ ] Document expiration dates (e.g., re-upload PAN every 2 years)
- [ ] Document quality checks before submission
- [ ] Admin notes/comments on rejections
- [ ] Bulk vendor approval/rejection
- [ ] Document storage in separate storage bucket with versioning
- [ ] Webhook notifications for approval status changes

