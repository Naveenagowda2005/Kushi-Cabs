# Vendor Verification System - Files Overview

## New Files Created

### 1. Database Migration
**File:** `supabase/migrations/051_vendor_documents_verification.sql`
- Creates vendor_documents table
- Creates vendor_verification_status table
- Creates vendor_document_type enum
- Creates trigger for syncing verification status
- Creates indexes for performance

### 2. Vendor Screens

#### `apps/unified/src/screens/vendor/VendorDocumentUploadScreen.js`
- Vendor document upload interface
- Displays 4 required document types
- Upload from camera or gallery
- Progress bar showing upload status
- Submit button (enabled only when all docs uploaded)
- Redirects to waiting screen after submission
- Features:
  - Document viewer to preview uploaded files
  - File information display
  - Error handling and retry
  - Pull-to-refresh functionality

#### `apps/unified/src/screens/vendor/VendorWaitingForApprovalScreen.js`
- Displays after vendor submits documents
- Timeline visualization:
  1. Documents Submitted ✓
  2. Under Review (active with pulse animation)
  3. Verification Complete (pending)
- Polls server every 5 seconds for status
- Auto-navigates if approved
- Shows rejection reason if rejected
- Contact support button
- Sign out button
- Helpful tips section

### 3. Admin Screens

#### `apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js`
- Super admin vendor verification interface
- Three tabs: Pending, Approved, Rejected
- Shows vendor details:
  - Full name
  - Business name
  - Phone number
  - Email
  - Submission date
- Document review section with thumbnails
- Can view full-size documents
- Actions:
  - Approve vendor (with confirmation)
  - Reject vendor (with reason popup)
- Shows rejection reasons for rejected vendors
- Pull-to-refresh functionality
- Empty state handling

## Modified Files

### 1. Navigation

#### `src/navigation/AuthNavigator.js`
**Changes:**
- Added import: `VendorDocumentUploadScreen`
- Added import: `VendorWaitingForApprovalScreen`
- Added route: `VendorDocumentUpload`
- Added route: `VendorWaitingForApproval`
- Both routes hide back button during signup flow

#### `src/navigation/VendorNavigator.js`
**Changes:**
- Added imports: `useEffect`, `useState`, `supabase`
- Added import: `VendorWaitingForApprovalScreen`
- Added verification status check on mount
- Conditional rendering based on verification status:
  - If `pending` or `rejected` → Show `VendorWaitingForApprovalScreen`
  - If `approved` or `not_started` → Show normal vendor dashboard
- Wraps entire navigator with loading state

#### `src/navigation/SuperAdminNavigator.js`
**Changes:**
- Added import: `AdminVendorVerificationDashboard`
- Updated TABS array:
  - Split "Verification" into two:
    - "Driver Verif" (for driver verification)
    - "Vendor Verif" (for vendor verification)
  - Both use checkmark icon

### 2. Authentication & Registration

#### `src/screens/auth/RegisterScreen.js`
**Changes:**
- Added vendor redirect logic
- When registration successful:
  - Drivers → `DriverDocumentUpload`
  - Vendors → `VendorDocumentUpload` (NEW)
  - Super admins → Show success alert

## Architecture Overview

```
User Role Selection
        ↓
    Sign Up (OTP)
        ↓
    Register (Profile)
        ↓
    ├─ DRIVER → DriverDocumentUpload → WaitingForApprovalScreen
    ├─ VENDOR → VendorDocumentUpload → VendorWaitingForApprovalScreen (NEW)
    └─ SUPER_ADMIN → Dashboard
        ↓
    APPROVAL FLOW:
    Super Admin → AdminVendorVerificationDashboard
        ↓
    Review documents → Approve/Reject
        ↓
    Vendor receives status → Dashboard if approved
```

## Data Flow

### Vendor Side:
```
1. Vendor registers
2. Upload documents to vendor_documents table
3. Submit for verification
4. Create vendor_verification_status record (pending)
5. Poll vendor_verification_status every 5 seconds
6. When approved:
   - vendor_verification_status.overall_status = "approved"
   - users.verification_status = "approved" (via trigger)
   - VendorNavigator shows dashboard
```

### Admin Side:
```
1. Query vendor_verification_status where status = "pending"
2. Query vendor_documents to get uploaded files
3. View documents
4. Approve/Reject
5. Update vendor_verification_status
6. Trigger syncs to users table
```

## Storage Structure

### Supabase Storage:
- Bucket: `vendor-documents`
- File naming: `vendor_{user_id}_{document_type}_{timestamp}.jpg`
- Example: `vendor_550e8400-e29b-41d4-a716-446655440000_AADHAR_1704067200000.jpg`

### Database Structure:
- Vendors' documents stored in `vendor_documents.documents` as JSONB
- Each document type contains: status, url, uploaded_at, rejection_reason
- Status field per document: pending, approved, rejected

## Component Dependencies

### VendorDocumentUploadScreen
- Dependencies:
  - `expo-image-picker` - Select/capture images
  - `expo-file-system` - Read file as base64
  - `supabase` - Upload to storage and database
  - `DocumentUploadCard` - Component for each document
  - `DocumentViewer` - View uploaded documents

### VendorWaitingForApprovalScreen
- Dependencies:
  - `supabase` - Poll verification status
  - `Animated` API - Pulse animation
  - `useFocusEffect` - Refresh on screen focus

### AdminVendorVerificationDashboard
- Dependencies:
  - `supabase` - Fetch vendors and update status
  - `DocumentViewer` - View vendor documents
  - Tab-based interface for status filtering

## Sync Mechanism

### Database Trigger:
```sql
CREATE TRIGGER trg_sync_vendor_verification_status
  AFTER INSERT OR UPDATE ON vendor_verification_status
  FOR EACH ROW EXECUTE FUNCTION sync_vendor_verification_status();
```

This automatically updates `users.verification_status` when vendor status changes, allowing quick checks during login and navigation.

## Testing Recommendations

### Unit Testing:
- Document upload validation
- Status polling logic
- Admin approval workflow

### Integration Testing:
- Full vendor signup flow
- Admin approval and rejection
- Status sync to users table
- Navigation based on verification status

### E2E Testing:
- Vendor signup → documents upload → waiting → approval → dashboard
- Admin review and approval
- Notification delivery (if implemented)

## Security Considerations

1. **RLS Policies:** Ensure vendors can only upload to their own folder
2. **Storage Access:** Only authenticated users can upload
3. **Admin Access:** Only super_admin role can approve/reject
4. **Data Privacy:** Documents not accessible to other vendors
5. **Validation:** File type and size limits on upload

## Performance Optimizations

1. **Polling:** 5-second interval with automatic cleanup on unmount
2. **Image Compression:** Image quality set to 0.8 during upload
3. **Lazy Loading:** Documents loaded on demand for viewing
4. **Pagination:** If many vendors, implement pagination in admin dashboard

## Known Limitations

1. **Documents JSONB:** Limited to 4 document types per vendor
2. **No Bulk Operations:** Admin must approve/reject one vendor at a time
3. **No Notifications:** Currently no email/SMS sent to vendor on approval
4. **Manual Polling:** Uses polling instead of real-time subscriptions

## Future Enhancements

1. Real-time subscriptions instead of polling
2. Email/SMS notifications on approval/rejection
3. Document expiration dates and renewal
4. Batch approval operations
5. Verification notes/comments
6. Document versioning and history
7. Automated verification checks (OCR, etc.)
8. Appeal process for rejections
