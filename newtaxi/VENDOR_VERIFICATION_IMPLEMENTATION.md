# Vendor Verification System Implementation

## Overview
This document outlines the complete vendor verification system that mirrors the driver verification process.

## Changes Made

### 1. Database Migration (051_vendor_documents_verification.sql)
Created new tables and functions:
- `vendor_documents` - Stores vendor verification documents (AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE)
- `vendor_verification_status` - Tracks overall vendor verification and approval status
- `vendor_document_type` enum - Document type constants
- Triggers to sync vendor verification status to users table

### 2. Frontend Screens Created

#### VendorDocumentUploadScreen.js
- Displays required documents to upload
- Allows vendors to capture documents from camera or gallery
- Shows upload progress
- Document types required:
  - Aadhar Card
  - PAN Card
  - Bank Passbook (Front Page)
  - Vendor Selfie (with Aadhar)
- Submit button appears only when all documents are uploaded
- Submits documents for admin verification

#### VendorWaitingForApprovalScreen.js
- Shows vendor that documents are submitted
- Timeline showing:
  1. Documents Submitted ✓
  2. Under Review (active)
  3. Verification Complete (pending)
- Polls server every 5 seconds for approval status
- Shows rejection reason if rejected
- Automatically navigates to vendor dashboard if approved
- Contact support button

#### AdminVendorVerificationDashboard.js
- Super Admin can verify vendor applications
- Three tabs: Pending, Approved, Rejected
- Shows vendor details:
  - Name
  - Business name
  - Phone
  - Email
  - Submission date
- Displays all uploaded documents with thumbnails
- Can view full-size documents
- Actions:
  - Approve vendor
  - Reject vendor with reason
- Shows rejection reason for rejected vendors

### 3. Updated Existing Files

#### RegisterScreen.js
- Now redirects vendors to `VendorDocumentUpload` after registration
- Same as driver flow

#### AuthNavigator.js
- Added imports for vendor document upload screens
- Added navigation routes:
  - `VendorDocumentUpload`
  - `VendorWaitingForApproval`

#### VendorNavigator.js
- Added verification status check on mount
- If vendor not approved, shows `VendorWaitingForApprovalScreen`
- If vendor approved, shows normal vendor dashboard
- Polls verification status similar to DriverNavigator

#### SuperAdminNavigator.js
- Added import for `AdminVendorVerificationDashboard`
- Added "Vendor Verif" tab to dashboard
- Split "Verification" into separate "Driver Verif" and "Vendor Verif" tabs

### 4. Document Types Required
Vendors must upload:
1. **AADHAR** - Aadhar Card (clear photo)
2. **PAN_CARD** - PAN Card (clear photo)
3. **BANK_PASSBOOK_FRONT** - Bank Passbook front page
4. **VENDOR_SELFIE** - Selfie with Aadhar Card

## Workflow

### Vendor Signup Flow
1. Vendor selects "Vendor" role
2. Completes phone OTP verification
3. Fills in profile (Name, Business Name)
4. Redirected to **VendorDocumentUploadScreen**
5. Uploads all required documents
6. Clicks "Submit for Verification"
7. Redirected to **VendorWaitingForApprovalScreen**
8. Waits for super admin approval (checks every 5 seconds)

### Super Admin Approval Flow
1. Super admin logs in
2. Goes to "Vendor Verif" tab
3. Views pending vendor applications
4. Reviews all submitted documents
5. Either:
   - **Approve**: Vendor can access dashboard
   - **Reject**: Provides reason, vendor sees rejection

### Vendor After Approval
1. Vendor sees "Account Approved" notification
2. Redirected to vendor dashboard
3. Can start creating trip enquiries

### Vendor After Rejection
1. Vendor sees rejection reason
2. Cannot access dashboard
3. Can contact support for next steps

## Storage
- Documents stored in Supabase Storage bucket: `vendor-documents`
- File naming: `vendor_{user_id}_{document_type}_{timestamp}.jpg`
- Documents stored in database as JSONB with metadata:
  ```json
  {
    "AADHAR": {
      "status": "pending|approved|rejected",
      "document_url": "...",
      "uploaded_at": "...",
      "rejection_reason": "..."
    },
    ...
  }
  ```

## Status Flow
```
not_started → pending → approved/rejected → verified
```

Status Updates:
- `not_started`: Initial state before document upload
- `pending`: Documents submitted, waiting for admin review
- `approved`: Admin approved - vendor can access dashboard
- `rejected`: Admin rejected - vendor cannot access dashboard

## Sync Mechanism
- Vendor verification status synced to `users.verification_status` table via trigger
- Allows quick status checks during login
- Prevents unauthorized access before approval

## Key Differences from Driver System
1. Vendor documents stored as JSONB in single record (vs individual rows for drivers)
2. Different document types (no vehicle docs, includes selfie)
3. Similar overall_status flow (not_started → pending → approved/rejected)
4. Both sync to users.verification_status for quick access

## Required Migrations
To deploy this system:
1. Run migration: `051_vendor_documents_verification.sql`
2. This creates all necessary tables, enums, and triggers
3. No data loss as it's purely additive

## Testing Checklist
- [ ] Vendor can sign up and upload documents
- [ ] All 4 document types can be uploaded
- [ ] Submit button disabled until all docs uploaded
- [ ] Vendor sees waiting screen with polling
- [ ] Super admin can view pending vendors
- [ ] Super admin can approve vendor
- [ ] Approved vendor redirects to dashboard
- [ ] Super admin can reject vendor with reason
- [ ] Rejected vendor sees reason
- [ ] Vendor status syncs to users table
