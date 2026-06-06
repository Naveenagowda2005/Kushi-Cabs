# Vendor Verification System - Flow Diagrams

## 1. Complete Vendor Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    VENDOR LIFECYCLE                         │
└─────────────────────────────────────────────────────────────┘

                          START
                            │
                            ▼
                    ┌───────────────┐
                    │ Role Selection│
                    │  (Vendor)     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Sign Up     │
                    │  (OTP Verify) │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Register     │
                    │ (Name, Biz)   │
                    └───────┬───────┘
                            │
                            ▼ NEW! ★
            ┌───────────────────────────────┐
            │ Document Upload Screen        │
            ├───────────────────────────────┤
            │ ✓ Aadhar Card                │
            │ ✓ PAN Card                   │
            │ ✓ Bank Passbook              │
            │ ✓ Vendor Selfie              │
            └───────┬───────────────────────┘
                    │
                    ▼ NEW! ★
        ┌───────────────────────────┐
        │ Waiting for Approval      │
        │ (Status: PENDING)         │
        │ [Auto-refresh every 5s]   │
        │                           │
        │ Timeline:                 │
        │ 1. Submitted ✓            │
        │ 2. Under Review ⏳        │
        │ 3. Verification Complete  │
        └────────┬──────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
    APPROVED           REJECTED
        │                  │
        │                  ▼
        │         ┌──────────────────┐
        │         │ See Rejection    │
        │         │ Reason           │
        │         └────────┬─────────┘
        │                  │
        │                  ▼
        │         Contact Support
        │         or Reapply
        │
        ▼
    ┌─────────────────────┐
    │ Vendor Dashboard    │
    ├─────────────────────┤
    │ • Available Trips   │
    │ • Create Enquiries  │
    │ • View Earnings     │
    │ • Trip History      │
    │ • Profile           │
    └─────────────────────┘
```

## 2. Vendor Signup → Document Upload Flow

```
┌──────────────────────────────────────────────────────────────┐
│            VENDOR SIGNUP TO DOCUMENT FLOW                    │
└──────────────────────────────────────────────────────────────┘

SignUp Screen                Register Screen           Document Upload
┌──────────────┐           ┌─────────────────┐        ┌──────────────────┐
│ Phone Entry  │ ──OTP──→  │ Name Entry      │ ──────→│ 4 Documents      │
│ OTP Verify   │           │ Business Name   │        │                  │
└──────────────┘           │ [Next]          │        │ 📷 Aadhar        │
                           └─────────────────┘        │ 📷 PAN           │
                                                      │ 📷 Passbook      │
                                                      │ 📷 Selfie        │
                                                      │                  │
                                                      │ Progress: 0/4    │
                                                      └────────┬─────────┘
                                                               │
                                         Document Upload Progress
                                         ┌─────────────────────┐
                                         │ User picks image    │
                                         │ or takes photo      │
                                         └────────┬────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────────┐
                                         │ Upload to Storage   │
                                         │ (vendor-documents)  │
                                         └────────┬────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────────┐
                                         │ Save URL to DB      │
                                         │ vendor_documents    │
                                         └────────┬────────────┘
                                                  │
                                    Repeat x4 for all documents
                                                  │
                                                  ▼
                                         ┌─────────────────────┐
                                         │ All 4 docs upload?  │
                                         └────────┬────────────┘
                                                  │
                                      ┌───────────┴───────────┐
                                      │                       │
                                    NO                      YES
                                      │                       │
                                      ▼                       ▼
                                  Keep waiting     [SUBMIT] Button
                                                    Enabled!
                                                      │
                                                      ▼
                                             Create vendor_verification_status
                                             (status: pending)
                                                      │
                                                      ▼
                                          Waiting for Approval Screen
```

## 3. Super Admin Approval Flow

```
┌──────────────────────────────────────────────────────────────┐
│          SUPER ADMIN VENDOR VERIFICATION FLOW                │
└──────────────────────────────────────────────────────────────┘

Super Admin Dashboard
┌────────────────────────────────────────────┐
│ ╔═════════════════════════════════════════╗│
│ ║ Vendor Verification Dashboard           ║│
│ ╠═════════════════════════════════════════╣│
│ ║ [Pending] [Approved] [Rejected]         ║│
│ ╠═════════════════════════════════════════╣│
│ ║                                         ║│
│ ║ Vendor: John Doe                        ║│
│ ║ Business: Quick Cabs                    ║│
│ ║ Phone: +91-1234567890                   ║│
│ ║ Email: john@email.com                   ║│
│ ║ Submitted: 2024-01-01 10:30 AM          ║│
│ ║                                         ║│
│ ║ Documents:                              ║│
│ ║ ┌─────────────────────────────────────┐ ║
│ ║ │ 📄 Aadhar  │ 📄 PAN    │ 📄 Bankbook │ ║
│ ║ │ ✓ Uploaded │ ✓ Uploaded│ ✓ Uploaded  │ ║
│ ║ │            │           │             │ ║
│ ║ │ 📄 Selfie  │           │             │ ║
│ ║ │ ✓ Uploaded │           │             │ ║
│ ║ └─────────────────────────────────────┘ ║
│ ║                                         ║
│ ║ [Tap document to view full size]        ║
│ ║                                         ║
│ ║ ┌─────────────────────────────────────┐ ║
│ ║ │ [✓ APPROVE VENDOR]  [✗ REJECT]      │ ║
│ ║ └─────────────────────────────────────┘ ║
│ │                                         │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    APPROVE              REJECT CLICKED
        │                       │
        ▼                       ▼
    ┌────────────┐      ┌──────────────┐
    │ Confirm    │      │ Modal:       │
    │ Approve?   │      │ Enter        │
    │            │      │ Rejection    │
    │ [OK][NO]   │      │ Reason       │
    └────┬───────┘      │              │
         │              │ [Cancel][OK] │
         │              └──────┬───────┘
         │                     │
         ▼                     ▼
    Update DB:          Update DB:
    overall_status      overall_status
    = 'approved'        = 'rejected'
         │              rejection_reason
         │              = "[reason]"
         │                     │
         ▼                     ▼
    Sync to users        Sync to users
    verification_status  verification_status
         │                     │
         ▼                     ▼
    Vendor sees           Vendor sees
    approval within       rejection reason
    5 seconds             on waiting screen
         │                     │
         ▼                     ▼
    Auto-redirect         Contact support
    to dashboard
```

## 4. Real-Time Polling Loop

```
┌──────────────────────────────────────────────────────┐
│        VENDOR WAITING FOR APPROVAL FLOW              │
└──────────────────────────────────────────────────────┘

Vendor on Waiting Screen
        │
        ▼
    ┌───────────────────┐
    │ Poll every 5 sec: │
    │ SELECT overall_   │
    │ status FROM       │
    │ vendor_           │
    │ verification_     │
    │ status            │
    └────────┬──────────┘
             │
    ┌────────┴────────┬─────────────┬──────────────┐
    │                 │             │              │
    ▼                 ▼             ▼              ▼
'pending'        'approved'     'rejected'    'not_started'
    │                 │             │              │
    │                 ▼             ▼              ▼
    │            Navigate to    Show rejection  Keep waiting
    │            Dashboard      Reason
    │                 │             │
    └─────────────────┴─────────────┘
            │
            ▼
    Wait 5 seconds
            │
    ┌───────┴────────┐
    │                │
  YES               NO
    │                │
    ▼                ▼
Continue           User
polling            navigates
                   away
                   │
                   ▼
                Cleanup
                (unmount)
```

## 5. Database State Transitions

```
┌──────────────────────────────────────────────────────────┐
│        DATABASE STATE TRANSITIONS                        │
└──────────────────────────────────────────────────────────┘

                  INITIAL STATE
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ vendor_verification_status       │
    ├──────────────────────────────────┤
    │ overall_status: 'not_started'   │
    │ all_documents_submitted: false  │
    │ submitted_at: null              │
    │ approved_at: null               │
    │ rejected_at: null               │
    └──────────────────┬───────────────┘
                       │
        After Documents Submitted
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ vendor_verification_status       │
    ├──────────────────────────────────┤
    │ overall_status: 'pending'       │ ◄─── Trigger syncs to
    │ all_documents_submitted: true   │     users.verification_
    │ submitted_at: 2024-01-01 10:30  │     status = 'pending'
    │ approved_at: null               │
    │ rejected_at: null               │
    └──────────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    APPROVED                      REJECTED
        │                             │
        ▼                             ▼
┌────────────────────┐  ┌────────────────────────────┐
│ overall_status:   │  │ overall_status: 'rejected' │
│ 'approved'        │  │ rejection_reason:          │
│                   │  │ "[reason text]"            │
│ approved_at:      │  │                            │
│ 2024-01-01 11:00  │  │ rejected_at:               │
│                   │  │ 2024-01-01 11:00           │
│ verified_by:      │  │                            │
│ [admin_id]        │  │ verified_by:               │
│                   │  │ [admin_id]                 │
└────────┬──────────┘  └────────┬───────────────────┘
         │                      │
         ▼                      ▼
    Trigger syncs          Trigger syncs
    users.verification_    users.verification_
    status = 'approved'    status = 'rejected'
         │                      │
         ▼                      ▼
    VendorNavigator     VendorNavigator shows
    shows dashboard     WaitingForApprovalScreen
                        with rejection reason
```

## 6. File Organization

```
Project Structure:
newtaxi/
│
├── apps/unified/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── vendor/
│   │   │   │   ├── VendorDocumentUploadScreen.js        ← NEW
│   │   │   │   ├── VendorWaitingForApprovalScreen.js    ← NEW
│   │   │   │   ├── EnquiriesScreen.js
│   │   │   │   ├── CreateTripScreen.js
│   │   │   │   └── ... (other vendor screens)
│   │   │   │
│   │   │   ├── superadmin/
│   │   │   │   ├── AdminVendorVerificationDashboard.js  ← NEW
│   │   │   │   ├── AdminVerificationDashboard.js
│   │   │   │   ├── DriversScreen.js
│   │   │   │   └── ... (other admin screens)
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── RegisterScreen.js                    ← MODIFIED
│   │   │       ├── SignUpScreen.js
│   │   │       └── ... (other auth screens)
│   │   │
│   │   └── navigation/
│   │       ├── AuthNavigator.js                         ← MODIFIED
│   │       ├── VendorNavigator.js                       ← MODIFIED
│   │       ├── SuperAdminNavigator.js                   ← MODIFIED
│   │       ├── DriverNavigator.js
│   │       └── RootNavigator.js
│   │
│   └── package.json
│
├── supabase/migrations/
│   ├── 051_vendor_documents_verification.sql            ← NEW
│   ├── ... (previous migrations)
│   └── README.md
│
├── VENDOR_VERIFICATION_IMPLEMENTATION.md                ← NEW
├── VENDOR_VERIFICATION_SETUP.md                         ← NEW
├── VENDOR_VERIFICATION_FILES.md                         ← NEW
├── VENDOR_VERIFICATION_QUICK_START.md                   ← NEW
└── VENDOR_VERIFICATION_COMPLETE_SUMMARY.md              ← NEW
```

## 7. Component Relationships

```
┌─────────────────────────────────────────────────┐
│         NAVIGATION HIERARCHY                    │
└─────────────────────────────────────────────────┘

RootNavigator
    │
    ├── RoleSelectionScreen
    │
    ├── AuthNavigator
    │   ├── LoginScreen
    │   ├── SignUpScreen
    │   ├── RegisterScreen
    │   ├── VendorDocumentUploadScreen          ← NEW
    │   ├── VendorWaitingForApprovalScreen      ← NEW
    │   ├── DriverDocumentUploadScreen
    │   └── WaitingForApprovalScreen
    │
    ├── VendorNavigator (With Status Check)     ← MODIFIED
    │   ├── Shows VendorWaitingForApprovalScreen (if not approved)
    │   └── Shows Tab Navigator (if approved)
    │       ├── EnquiriesStack
    │       ├── TripHistoryScreen
    │       └── ProfileStack
    │
    ├── DriverNavigator (Status Check Pattern)
    │   ├── Shows WaitingForApprovalScreen (if not approved)
    │   └── Shows Tab Navigator (if approved)
    │
    └── SuperAdminNavigator
        ├── Dashboard
        ├── DriverVerificationDashboard
        ├── AdminVendorVerificationDashboard     ← NEW
        ├── VendorsScreen
        ├── DriversScreen
        └── ... (other tabs)
```

---

## Key Transitions at a Glance

| Step | Screen | User Action | Next State |
|------|--------|-------------|-----------|
| 1 | SignUp | Enter phone, get OTP | Register |
| 2 | Register | Enter name, business | VendorDocumentUpload |
| 3 | VendorDocumentUpload | Upload 4 docs | VendorWaitingForApproval |
| 4 | VendorWaitingForApproval | Wait (polling) | Dashboard or Stay |
| 5-A | Super Admin | Review & Approve | Vendor sees approval |
| 5-B | Super Admin | Review & Reject | Vendor sees reason |

---

This visual breakdown makes it clear how vendors flow through the system and how data moves between screens and database!
