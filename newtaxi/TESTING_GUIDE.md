# Driver Onboarding - Testing Guide

## Prerequisites
- Expo server running on port 8081
- Backend SMS server running on port 4000
- Database migrations applied (037, 038, 039)
- Test phone number: `9686314982` (admin phone for OTP testing)

## Test Scenario 1: Complete Driver Signup Flow

### Steps
1. Open app and select "Driver" role
2. Click "Sign Up"
3. Enter phone: `9686314982`
4. Click "Request OTP"
5. Enter OTP (check backend logs or use test OTP)
6. Click "Verify"
7. Fill registration form:
   - Full Name: Test Driver
   - License Number: DL123456
   - Vehicle Number: MH01AB1234
8. Click "Complete Registration"

### Expected Results
- ✅ No alert shown
- ✅ Redirected directly to "Upload Documents" screen (NOT dashboard)
- ✅ Driver is NOT logged in (no session)
- ✅ Can see 6 document upload cards

## Test Scenario 2: Document Upload

### Steps
1. From document upload screen, click on each document card
2. Select "Take Photo" or "Choose from Gallery"
3. Upload all 6 documents:
   - DL (Driver's License)
   - VEHICLE_FRONT (Vehicle Front)
   - INSURANCE (Insurance)
   - FC (Fitness Certificate)
   - EMISSION (Emission)
   - RC (Registration Certificate)
4. Verify progress bar shows 6/6

### Expected Results
- ✅ Each document uploads successfully
- ✅ Progress bar updates to show uploaded count
- ✅ "Submit for Verification" button becomes enabled
- ✅ Can view uploaded documents by clicking on cards

## Test Scenario 3: Document Submission

### Steps
1. After uploading all 6 documents, click "Submit for Verification"
2. Confirm in alert dialog

### Expected Results
- ✅ Alert shows: "Documents submitted for verification. You will now be logged out. You can login once your documents are approved."
- ✅ Driver is logged out
- ✅ Redirected to "Your Onboarding Journey" timeline screen
- ✅ Timeline shows Step 3 as active: "Documents Submitted"

## Test Scenario 4: Onboarding Timeline

### Steps
1. View the timeline screen after document submission
2. Scroll through all 5 steps

### Expected Results
- ✅ Step 1 (Account Created) - Completed (green checkmark)
- ✅ Step 2 (Documents Uploaded) - Completed (green checkmark)
  - Shows: "6 of 6 documents uploaded"
  - Lists all 6 documents with status
- ✅ Step 3 (Documents Submitted) - Active (blue highlight)
  - Shows submission date
- ✅ Step 4 (Under Review) - Pending (gray)
  - Shows message: "Our admin team is reviewing your documents. This usually takes 24-48 hours."
- ✅ Step 5 (Account Approved) - Pending (gray)
- ✅ Progress bar shows 3/5 steps completed

## Test Scenario 5: Admin Approval

### Steps
1. Login as Super Admin
2. Navigate to Admin Verification Dashboard
3. Find the test driver's documents
4. Review each document
5. Click "Approve All" or approve individually

### Expected Results
- ✅ All documents marked as approved
- ✅ Driver's `overall_status` changed to "approved"
- ✅ Timeline updates to show Step 5 as active

## Test Scenario 6: Driver Login After Approval

### Steps
1. Logout from admin account
2. Select "Driver" role
3. Click "Login"
4. Enter phone: `9686314982`
5. Request and verify OTP
6. Click "Login"

### Expected Results
- ✅ Login successful
- ✅ Redirected to Driver Dashboard
- ✅ Can access all driver features

## Test Scenario 7: Driver Login Before Approval

### Steps
1. Create a new driver account
2. Upload and submit documents
3. Try to login before admin approves

### Expected Results
- ✅ Login rejected
- ✅ Alert shows: "Your documents are pending verification. Please wait for admin approval."
- ✅ Driver cannot access dashboard

## Test Scenario 8: Document Rejection and Re-upload

### Steps
1. As admin, reject one document
2. Driver logs out and tries to login
3. Driver uploads new document
4. Admin approves

### Expected Results
- ✅ Rejected document shows red status
- ✅ Timeline shows rejection reason
- ✅ Driver can re-upload rejected document
- ✅ After re-upload and approval, driver can login

## Debugging Tips

### Check Document Status
```javascript
// In browser console or debug logs
// Check if documents are in database
SELECT * FROM driver_documents WHERE driver_id = '<user-id>';

// Check verification status
SELECT * FROM driver_verification_status WHERE driver_id = '<user-id>';
```

### Check Timeline Logic
- Timeline step is determined by:
  1. Account created = Step 1 (always true)
  2. Documents exist = Step 2
  3. all_documents_submitted = true = Step 3
  4. overall_status = 'pending' AND all_documents_submitted = true = Step 4
  5. overall_status = 'approved' = Step 5

### Common Issues

**Issue**: Driver redirected to dashboard instead of document upload
- **Solution**: Check `createUserProfile()` in AuthContext - should NOT call `refreshUserProfile()` for drivers

**Issue**: Timeline not updating after admin approval
- **Solution**: Pull latest code, check if `getDriverVerificationStatus()` is fetching latest data

**Issue**: Submit button disabled even with all documents uploaded
- **Solution**: Check if all documents have `status !== 'pending'` or have `document_data`

**Issue**: Cannot view uploaded documents
- **Solution**: Check if `document_data` is stored as base64 in database, not in Supabase Storage

## Performance Notes

- Timeline screen loads verification status and documents on focus
- Pull-to-refresh available on timeline screen
- Document viewer uses base64 data (no network calls)
- All data stored in database, not in cloud storage

## Security Notes

- RLS policies ensure drivers can only see their own documents
- Admin can only see documents for verification
- OTP-verified sessions used for authentication
- No password stored for drivers (OTP-only)
