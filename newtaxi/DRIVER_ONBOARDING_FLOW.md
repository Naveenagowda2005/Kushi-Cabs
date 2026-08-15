# Driver Onboarding Flow - Complete Implementation

## Overview
This document describes the complete driver onboarding flow with document verification and timeline tracking.

## Flow Steps

### 1. Driver Registration
- Driver selects "Driver" role on login screen
- Enters phone number on SignUp screen
- Completes registration form with:
  - Full name
  - License number
  - Vehicle number
- **Result**: User profile created in database, driver is NOT logged in yet

### 2. Document Upload Screen
- After registration, driver is redirected to `DriverDocumentUploadScreen`
- Driver must upload 6 required documents:
  1. DL (Driver's License)
  2. VEHICLE_FRONT (Vehicle Front Photo)
  3. INSURANCE (Insurance Certificate)
  4. FC (Fitness Certificate)
  5. EMISSION (Emission Certificate)
  6. RC (Registration Certificate)
- Each document is stored as base64 in the database `driver_documents` table
- Progress bar shows: X/6 documents uploaded
- **Submit Button**: Only enabled when all 6 documents are uploaded

### 3. Document Submission
- Driver clicks "Submit for Verification"
- Documents are marked as submitted in database
- Driver is logged out automatically
- Alert shows: "Documents submitted for verification. You will now be logged out. You can login once your documents are approved."
- Driver is navigated to `DriverOnboardingTimelineScreen`

### 4. Onboarding Timeline Screen
- Shows 5-step timeline of the onboarding process:
  1. **Account Created** - Always completed (driver is here)
  2. **Documents Uploaded** - Shows count of uploaded documents
  3. **Documents Submitted** - Shows submission date
  4. **Under Review** - Shows message about admin review (24-48 hours)
  5. **Account Approved** - Shows approval date (when admin approves)

- Timeline is accessible from AuthNavigator (before login)
- Driver can view progress at any time
- Timeline updates in real-time based on database status

### 5. Admin Verification
- Super admin logs in to `AdminVerificationDashboard`
- Reviews all pending driver documents
- Can approve or reject each document
- Once all documents are approved, driver's `overall_status` is set to "approved"

### 6. Driver Login
- Driver attempts to login with phone number
- System checks `driver_verification_status.overall_status`
- **If NOT approved**: Login rejected with message "Your documents are pending verification. Please wait for admin approval."
- **If approved**: Driver can login and access dashboard

## Database Schema

### driver_documents table
```sql
- id (UUID, primary key)
- driver_id (UUID, foreign key to users)
- document_type (TEXT: DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC)
- document_data (TEXT: base64 encoded image)
- status (TEXT: pending, approved, rejected)
- rejection_reason (TEXT: optional reason if rejected)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### driver_verification_status table
```sql
- id (UUID, primary key)
- driver_id (UUID, foreign key to users)
- overall_status (TEXT: pending, approved, rejected)
- all_documents_submitted (BOOLEAN)
- submitted_at (TIMESTAMP)
- verified_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Navigation Structure

### AuthNavigator (Before Login)
- Login
- SignUp
- Register
- Otp
- DriverDocumentUpload (for drivers after registration)
- DriverOnboardingTimeline (for drivers to view progress)
- Terms & Conditions
- Cancellation Policy

### DriverNavigator (After Login)
- Trips (Dashboard, Trip Details, Active Trip, Trip History)
- Wallet (Transaction History)
- History (Trip History)
- Profile (Profile, Document Upload, Verification Status, Terms, Cancellation Policy)

## Key Features

### Document Upload
- Supports camera capture or gallery selection
- Stores as base64 in database (not in Supabase Storage)
- Shows upload progress
- Allows re-upload if rejected

### Timeline Tracking
- Visual 5-step timeline
- Progress bar showing current step
- Real-time status updates
- Shows relevant information for each step:
  - Step 2: Document count and status
  - Step 3: Submission date
  - Step 4: Review message
  - Step 5: Approval date

### Admin Dashboard
- Lists all pending driver documents
- Shows document preview
- Approve/reject functionality
- Bulk operations support

## Authentication Logic

### signIn() function in AuthContext
1. Verify user exists in database
2. **For drivers**: Check if `driver_verification_status.overall_status === 'approved'`
3. If NOT approved: Throw error "Your documents are pending verification..."
4. If approved: Create OTP-verified session and allow login

### createUserProfile() function in AuthContext
1. Create user profile in database
2. Create role-specific profile (vendor or driver)
3. **For vendors**: Call `refreshUserProfile()` to log them in
4. **For drivers**: DO NOT call `refreshUserProfile()` - keep them logged out

## Testing Checklist

- [ ] Driver signup flow redirects to document upload (not dashboard)
- [ ] All 6 documents can be uploaded
- [ ] Submit button only enabled when all documents uploaded
- [ ] After submission, driver is logged out
- [ ] Timeline screen shows correct step based on status
- [ ] Timeline updates when admin approves documents
- [ ] Driver cannot login until documents are approved
- [ ] Admin can approve/reject documents
- [ ] Driver can re-upload rejected documents
- [ ] Timeline shows all 5 steps with correct information

## Files Modified

### Navigation
- `src/navigation/AuthNavigator.js` - Added DriverOnboardingTimelineScreen

### Screens
- `src/screens/driver/DriverDocumentUploadScreen.js` - Updated to navigate to timeline after submission
- `src/screens/driver/DriverOnboardingTimelineScreen.js` - Timeline display (already created)
- `src/screens/auth/RegisterScreen.js` - Redirects drivers to document upload (already updated)

### Context
- `src/context/AuthContext.js` - Document verification logic in signIn() and createUserProfile() (already updated)

### Services
- `src/services/documentService.js` - Document operations (already created)

### Components
- `src/components/DocumentUploadCard.js` - Document card UI (already created)
- `src/components/DocumentViewer.js` - Document preview modal (already created)

### Database
- `supabase/migrations/037_driver_documents_verification.sql` - Document schema
- `supabase/migrations/038_add_verification_status_to_users.sql` - Verification status
- `supabase/migrations/039_driver_verification_rls_policies.sql` - Security policies

## Environment Configuration

### .env file
```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_SMS_API_URL=http://192.168.1.111:4000
```

### SMS Configuration
- API URL: `http://192.168.1.111:4000`
- API Key: `26568C0BBD2CEC`
- Sender ID: `KUSCAB`
- Route ID: `13`
- Template ID: `1707177980314073534`

## Next Steps

1. Apply database migrations (037, 038, 039) to Supabase
2. Test complete signup flow for drivers
3. Test login flow with document verification
4. Test admin verification dashboard
5. Test timeline screen updates
6. Verify all 5 steps display correctly
