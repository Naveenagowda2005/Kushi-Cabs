# Complete Driver Verification Workflow

## Overview
This document describes the complete workflow from driver signup to login after document approval.

## Step-by-Step Workflow

### PHASE 1: DRIVER SIGNUP & DOCUMENT UPLOAD

#### Step 1: Driver Selects Role
- App shows role selection screen
- Driver selects "Driver" role

#### Step 2: Driver Signs Up
- Enters phone number
- Requests OTP
- Verifies OTP
- Completes registration form:
  - Full Name
  - License Number
  - Vehicle Number

#### Step 3: Redirected to Document Upload
- Driver automatically redirected to "Upload Documents" screen
- NOT logged in yet
- Sees 6 document cards:
  - DL (Driver License)
  - VEHICLE_FRONT (Vehicle Front Photo)
  - INSURANCE (Insurance Certificate)
  - FC (Fitness Certificate)
  - EMISSION (Emission Certificate)
  - RC (Registration Certificate)

#### Step 4: Upload Documents
- Driver clicks on each document card
- Chooses "Camera" or "Gallery"
- Selects/takes image
- Document uploads to database

**Visual Feedback**:
- Status changes to "Uploaded - Pending Review" (orange)
- Button shows "Uploaded" with green checkmark
- Icon becomes green
- Progress bar updates (1/6, 2/6, etc.)

#### Step 5: All Documents Uploaded
- Progress bar shows 6/6
- "Submit for Verification" button becomes **ENABLED**
- Driver can now submit

---

### PHASE 2: DOCUMENT SUBMISSION

#### Step 6: Driver Submits Documents
- Driver clicks "Submit for Verification"
- Alert shows: "Documents submitted for verification. You will now be logged out. You can login once your documents are approved."
- Driver clicks "OK"

#### Step 7: Driver Logged Out
- Driver session ends
- Automatically logged out

#### Step 8: Timeline Screen
- Driver sees "Your Onboarding Journey" timeline
- Shows 5 steps:
  1. ✓ Account Created (completed)
  2. ✓ Documents Uploaded (completed)
  3. ● Documents Submitted (active - orange)
  4. ○ Under Review (pending - gray)
  5. ○ Account Approved (pending - gray)

**Progress**: 3/5 steps completed

---

### PHASE 3: ADMIN VERIFICATION

#### Step 9: Super Admin Logs In
- Super Admin enters phone: 9686314982
- Requests OTP
- Verifies OTP
- Logs in successfully

#### Step 10: Go to Verification Tab
- Super Admin sees bottom tab bar with multiple tabs
- Clicks on "Verification" tab
- Opens Admin Verification Dashboard

#### Step 11: View Pending Drivers
- Dashboard shows list of drivers with pending documents
- Shows driver name, phone, email
- Shows all 6 documents for each driver

#### Step 12: Review Documents
- Super Admin clicks on driver card to expand
- Sees all 6 documents with status
- Can click on each document to view preview
- Reads document details

#### Step 13: Approve Documents
- For each document, Super Admin can:
  - **Approve**: Click green checkmark button
  - **Reject**: Click red X button (must provide reason)

#### Step 14: Approve All Documents
- Super Admin approves all 6 documents
- Each document status changes to "Approved"
- Driver's overall status changes to "Approved"

---

### PHASE 4: DRIVER LOGIN

#### Step 15: Driver Attempts Login
- Driver goes back to app
- Selects "Driver" role
- Enters phone number
- Requests OTP
- Verifies OTP

#### Step 16: Login Check
- System checks if documents are approved
- If approved: Login successful ✅
- If not approved: Login rejected ❌

#### Step 17: Driver Logged In
- Driver can now access dashboard
- Can see available trips
- Can accept trips
- Can start driving

---

## Database State Changes

### After Registration
```
users table:
├─ id: <user-id>
├─ phone: 9686314982
├─ role: driver
└─ is_active: true

drivers table:
├─ user_id: <user-id>
├─ license_number: DL123456
└─ vehicle_number: MH01AB1234

driver_documents table: (empty)
driver_verification_status table: (empty)
```

### After Document Upload
```
driver_documents table:
├─ id: doc-1, type: DL, status: pending, data: <base64>
├─ id: doc-2, type: VEHICLE_FRONT, status: pending, data: <base64>
├─ id: doc-3, type: INSURANCE, status: pending, data: <base64>
├─ id: doc-4, type: FC, status: pending, data: <base64>
├─ id: doc-5, type: EMISSION, status: pending, data: <base64>
└─ id: doc-6, type: RC, status: pending, data: <base64>

driver_verification_status table: (empty - created on first upload)
```

### After Document Submission
```
driver_verification_status table:
├─ driver_id: <user-id>
├─ overall_status: pending
├─ all_documents_submitted: true
├─ submitted_at: 2026-06-01 10:30:00
└─ verified_at: null
```

### After Admin Approval
```
driver_documents table:
├─ All documents: status: approved

driver_verification_status table:
├─ overall_status: approved
├─ verified_at: 2026-06-01 11:00:00
```

---

## Timeline Updates

### After Registration
```
Step 1: ✓ Account Created
Step 2: ○ Documents Uploaded
Step 3: ○ Documents Submitted
Step 4: ○ Under Review
Step 5: ○ Account Approved
Progress: 1/5
```

### After Document Upload
```
Step 1: ✓ Account Created
Step 2: ✓ Documents Uploaded (6 of 6)
Step 3: ○ Documents Submitted
Step 4: ○ Under Review
Step 5: ○ Account Approved
Progress: 2/5
```

### After Document Submission
```
Step 1: ✓ Account Created
Step 2: ✓ Documents Uploaded
Step 3: ● Documents Submitted (Submitted on June 1, 2026)
Step 4: ○ Under Review
Step 5: ○ Account Approved
Progress: 3/5
```

### After Admin Approval
```
Step 1: ✓ Account Created
Step 2: ✓ Documents Uploaded
Step 3: ✓ Documents Submitted
Step 4: ✓ Under Review
Step 5: ● Account Approved (Approved on June 1, 2026)
Progress: 5/5
```

---

## Key Features

### For Drivers
✅ Clear upload status feedback
✅ Progress tracking (X/6 documents)
✅ Timeline showing onboarding progress
✅ Cannot login until approved
✅ Can re-upload rejected documents
✅ Automatic logout after submission

### For Admin
✅ View all pending drivers
✅ Review document previews
✅ Approve/reject documents
✅ Provide rejection reasons
✅ Track verification status

### For System
✅ Base64 document storage
✅ Real-time status updates
✅ RLS policies for security
✅ Automatic triggers for status updates
✅ OTP-only authentication

---

## Testing Checklist

### Driver Signup
- [ ] Can select driver role
- [ ] Can sign up with phone
- [ ] Can verify OTP
- [ ] Can complete registration
- [ ] Redirected to document upload

### Document Upload
- [ ] Can upload all 6 documents
- [ ] Status shows "Uploaded - Pending Review"
- [ ] Button shows "Uploaded"
- [ ] Progress bar updates
- [ ] Submit button becomes enabled

### Document Submission
- [ ] Can click submit button
- [ ] Alert shows correct message
- [ ] Driver logged out
- [ ] Redirected to timeline
- [ ] Timeline shows Step 3 active

### Admin Verification
- [ ] Admin can login
- [ ] Can access Verification tab
- [ ] Can see pending drivers
- [ ] Can view documents
- [ ] Can approve documents
- [ ] Can reject documents

### Driver Login After Approval
- [ ] Cannot login before approval
- [ ] Can login after approval
- [ ] Can access dashboard
- [ ] Can see trips

---

## Troubleshooting

### Submit Button Disabled
- Check if all 6 documents uploaded
- Check if documents have `document_data`
- Refresh page
- Check console for errors

### Timeline Not Updating
- Pull to refresh
- Check database for verification status
- Verify `all_documents_submitted` is true
- Check console logs

### Admin Cannot See Documents
- Verify admin is logged in as super_admin
- Check RLS policies
- Verify documents in database
- Check console for errors

### Driver Cannot Login After Approval
- Check if `overall_status` is "approved"
- Verify verification status record exists
- Check RLS policies
- Restart app

---

## Complete Flow Summary

```
Driver Signup
    ↓
Register (Name, License, Vehicle)
    ↓
Document Upload Screen
    ↓
Upload 6 Documents (with visual feedback)
    ↓
Submit for Verification (button enabled)
    ↓
Logout + Timeline Screen (Step 3 active)
    ↓
Admin Reviews Documents
    ↓
Admin Approves All Documents
    ↓
Timeline Updates (Step 5 active)
    ↓
Driver Can Login
    ↓
Access Dashboard
```

---

**Status**: Complete workflow implemented
**Next Action**: Test complete flow end-to-end
