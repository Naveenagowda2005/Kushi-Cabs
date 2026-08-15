# Driver Onboarding Flow - Visual Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DRIVER ONBOARDING FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  App Start   │
                              └──────┬───────┘
                                     │
                              ┌──────▼───────┐
                              │ Select Role  │
                              │   (Driver)   │
                              └──────┬───────┘
                                     │
                              ┌──────▼───────┐
                              │  Login/Signup│
                              │   Screen     │
                              └──────┬───────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
            ┌───────▼────────┐            ┌──────────▼──────┐
            │  Existing User │            │   New User      │
            │   (Login)      │            │   (Sign Up)     │
            └───────┬────────┘            └──────────┬──────┘
                    │                                 │
                    │                         ┌───────▼────────┐
                    │                         │  Enter Phone   │
                    │                         │  Request OTP   │
                    │                         └───────┬────────┘
                    │                                 │
                    │                         ┌───────▼────────┐
                    │                         │  Verify OTP    │
                    │                         └───────┬────────┘
                    │                                 │
                    │                         ┌───────▼────────┐
                    │                         │ Registration   │
                    │                         │ Form (Name,    │
                    │                         │ License, etc)  │
                    │                         └───────┬────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ Create User Profile    │
                    │                         │ (NOT logged in yet)    │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ DOCUMENT UPLOAD SCREEN │
                    │                         │ (6 Required Documents) │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ Upload Documents:      │
                    │                         │ • DL                   │
                    │                         │ • Vehicle Front        │
                    │                         │ • Insurance            │
                    │                         │ • FC                   │
                    │                         │ • Emission             │
                    │                         │ • RC                   │
                    │                         │                        │
                    │                         │ Progress: 0/6 → 6/6   │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ Submit Documents       │
                    │                         │ (All 6 uploaded)       │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ Logout Driver          │
                    │                         │ (Auto-logout)          │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ TIMELINE SCREEN        │
                    │                         │ (Onboarding Progress)  │
                    │                         │                        │
                    │                         │ Step 1: ✓ Created      │
                    │                         │ Step 2: ✓ Uploaded     │
                    │                         │ Step 3: ● Submitted    │
                    │                         │ Step 4: ○ Under Review │
                    │                         │ Step 5: ○ Approved     │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ Wait for Admin Review   │
                    │                         │ (24-48 hours)          │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                    ┌────────────┴────────────┐
                    │                    │                         │
                    │            ┌───────▼────────┐      ┌────────▼──────┐
                    │            │ Admin Reviews  │      │ Admin Reviews  │
                    │            │ & Approves     │      │ & Rejects      │
                    │            └───────┬────────┘      └────────┬──────┘
                    │                    │                        │
                    │            ┌───────▼────────┐      ┌────────▼──────┐
                    │            │ Timeline Step  │      │ Driver Re-    │
                    │            │ 5: Approved    │      │ uploads Docs  │
                    │            └───────┬────────┘      └────────┬──────┘
                    │                    │                        │
                    │                    │                ┌───────▼────────┐
                    │                    │                │ Admin Reviews  │
                    │                    │                │ Again          │
                    │                    │                └───────┬────────┘
                    │                    │                        │
                    │                    └────────────┬───────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ Driver Attempts Login  │
                    │                         │ (Phone + OTP)          │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                         ┌───────▼────────────────┐
                    │                         │ Check Verification     │
                    │                         │ Status in Database     │
                    │                         └───────┬────────────────┘
                    │                                 │
                    │                    ┌────────────┴────────────┐
                    │                    │                         │
                    │            ┌───────▼────────┐      ┌────────▼──────┐
                    │            │ Status =       │      │ Status !=     │
                    │            │ "approved"     │      │ "approved"    │
                    │            └───────┬────────┘      └────────┬──────┘
                    │                    │                        │
                    │            ┌───────▼────────┐      ┌────────▼──────┐
                    │            │ ✓ LOGIN OK     │      │ ✗ LOGIN DENIED│
                    │            │ Create Session │      │ Show Error:   │
                    │            └───────┬────────┘      │ "Pending      │
                    │                    │                │ Verification" │
                    │                    │                └────────┬──────┘
                    │                    │                         │
                    │            ┌───────▼────────┐      ┌────────▼──────┐
                    │            │ DRIVER LOGGED  │      │ Return to     │
                    │            │ IN             │      │ Login Screen  │
                    │            └───────┬────────┘      └───────────────┘
                    │                    │
                    │            ┌───────▼────────┐
                    │            │ Access Driver  │
                    │            │ Dashboard      │
                    │            └────────────────┘
                    │
                    └──────────────────────────────────────────────────────┘
```

## Database State Transitions

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE STATE TRANSITIONS                           │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: After Registration
┌──────────────────────────────────────────────────────────────────────┐
│ users table:                                                         │
│ ├─ id: <user-id>                                                    │
│ ├─ phone: 9686314982                                               │
│ ├─ role_id: driver                                                 │
│ └─ is_active: true                                                 │
│                                                                      │
│ drivers table:                                                       │
│ ├─ user_id: <user-id>                                              │
│ ├─ license_number: DL123456                                        │
│ └─ vehicle_number: MH01AB1234                                      │
│                                                                      │
│ driver_documents table: (empty)                                     │
│                                                                      │
│ driver_verification_status table: (empty)                           │
└──────────────────────────────────────────────────────────────────────┘

STEP 2: After Document Upload
┌──────────────────────────────────────────────────────────────────────┐
│ driver_documents table:                                              │
│ ├─ id: doc-1, type: DL, status: pending, data: <base64>           │
│ ├─ id: doc-2, type: VEHICLE_FRONT, status: pending, data: <base64>│
│ ├─ id: doc-3, type: INSURANCE, status: pending, data: <base64>    │
│ ├─ id: doc-4, type: FC, status: pending, data: <base64>           │
│ ├─ id: doc-5, type: EMISSION, status: pending, data: <base64>     │
│ └─ id: doc-6, type: RC, status: pending, data: <base64>           │
│                                                                      │
│ driver_verification_status table: (empty)                           │
└──────────────────────────────────────────────────────────────────────┘

STEP 3: After Document Submission
┌──────────────────────────────────────────────────────────────────────┐
│ driver_verification_status table:                                    │
│ ├─ driver_id: <user-id>                                             │
│ ├─ overall_status: pending                                          │
│ ├─ all_documents_submitted: true                                    │
│ ├─ submitted_at: 2026-06-01 10:30:00                               │
│ └─ verified_at: null                                                │
└──────────────────────────────────────────────────────────────────────┘

STEP 4: After Admin Approval
┌──────────────────────────────────────────────────────────────────────┐
│ driver_documents table:                                              │
│ ├─ All documents: status: approved                                  │
│                                                                      │
│ driver_verification_status table:                                    │
│ ├─ overall_status: approved                                         │
│ ├─ verified_at: 2026-06-01 11:00:00                                │
└──────────────────────────────────────────────────────────────────────┘

STEP 5: After Login
┌──────────────────────────────────────────────────────────────────────┐
│ Session created with:                                                │
│ ├─ user_id: <user-id>                                               │
│ ├─ role: driver                                                     │
│ ├─ access_token: otp-verified-<phone>-<timestamp>                 │
│ └─ expires_at: <timestamp + 3600 seconds>                          │
└──────────────────────────────────────────────────────────────────────┘
```

## Timeline Screen State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TIMELINE SCREEN STATES                              │
└─────────────────────────────────────────────────────────────────────────┘

AFTER REGISTRATION (Before Document Upload)
┌──────────────────────────────────────────────────────────────────────┐
│ Step 1: ✓ Account Created                                            │
│ Step 2: ○ Documents Uploaded                                         │
│ Step 3: ○ Documents Submitted                                        │
│ Step 4: ○ Under Review                                               │
│ Step 5: ○ Account Approved                                           │
│                                                                      │
│ Progress: 1/5 (20%)                                                 │
└──────────────────────────────────────────────────────────────────────┘

AFTER DOCUMENT UPLOAD (Before Submission)
┌──────────────────────────────────────────────────────────────────────┐
│ Step 1: ✓ Account Created                                            │
│ Step 2: ✓ Documents Uploaded                                         │
│         └─ 6 of 6 documents uploaded                                │
│ Step 3: ○ Documents Submitted                                        │
│ Step 4: ○ Under Review                                               │
│ Step 5: ○ Account Approved                                           │
│                                                                      │
│ Progress: 2/5 (40%)                                                 │
└──────────────────────────────────────────────────────────────────────┘

AFTER DOCUMENT SUBMISSION (Waiting for Admin)
┌──────────────────────────────────────────────────────────────────────┐
│ Step 1: ✓ Account Created                                            │
│ Step 2: ✓ Documents Uploaded                                         │
│ Step 3: ● Documents Submitted                                        │
│         └─ Submitted on June 1, 2026                                │
│ Step 4: ○ Under Review                                               │
│ Step 5: ○ Account Approved                                           │
│                                                                      │
│ Progress: 3/5 (60%)                                                 │
└──────────────────────────────────────────────────────────────────────┘

AFTER ADMIN APPROVAL
┌──────────────────────────────────────────────────────────────────────┐
│ Step 1: ✓ Account Created                                            │
│ Step 2: ✓ Documents Uploaded                                         │
│ Step 3: ✓ Documents Submitted                                        │
│ Step 4: ✓ Under Review                                               │
│ Step 5: ● Account Approved                                           │
│         └─ Approved on June 1, 2026                                 │
│                                                                      │
│ Progress: 5/5 (100%)                                                │
│                                                                      │
│ Message: "You can now login and start driving"                      │
└──────────────────────────────────────────────────────────────────────┘

Legend:
✓ = Completed (green)
● = Active/Current (blue)
○ = Pending (gray)
```

## Navigation Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NAVIGATION STRUCTURE                                │
└─────────────────────────────────────────────────────────────────────────┘

AuthNavigator (Before Login)
├── Login Screen
├── SignUp Screen
├── Register Screen
├── OTP Screen
├── DriverDocumentUpload Screen
│   └── (After submission) → DriverOnboardingTimeline Screen
├── DriverOnboardingTimeline Screen
│   ├── (Click "Upload Documents") → DriverDocumentUpload Screen
│   └── (Click "View Details") → DriverVerificationStatus Screen
├── Terms & Conditions
└── Cancellation Policy

RootNavigator (After Login)
├── DriverNavigator (for drivers)
│   ├── Trips Stack
│   │   ├── Dashboard
│   │   ├── Trip Detail
│   │   ├── Active Trip
│   │   └── Trip History
│   ├── Wallet
│   ├── History
│   └── Profile Stack
│       ├── Profile
│       ├── Document Upload
│       ├── Verification Status
│       ├── Terms
│       └── Cancellation Policy
├── VendorNavigator (for vendors)
└── AdminNavigator (for admins)
    └── Admin Verification Dashboard
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT STRUCTURE                                 │
└─────────────────────────────────────────────────────────────────────────┘

DriverDocumentUploadScreen
├── Header
├── ProgressSection
│   ├── ProgressBar
│   └── ProgressStats
├── DocumentsSection
│   └── DocumentUploadCard (x6)
│       ├── DocumentIcon
│       ├── DocumentStatus
│       └── UploadButton
├── InfoBox
├── DocumentViewer (Modal)
│   └── DocumentImage (base64)
└── SubmitButton

DriverOnboardingTimelineScreen
├── Header
├── ProgressContainer
│   └── ProgressBar
├── TimelineContainer
│   └── TimelineItem (x5)
│       ├── TimelineLeft
│       │   ├── TimelineDot
│       │   └── TimelineLine
│       └── TimelineContent
│           └── StepCard
│               ├── StepHeader
│               ├── StepDescription
│               ├── StepContent
│               └── ActionButton
└── InfoBox
```

---

This diagram shows the complete flow from signup to login, including all database state changes and UI transitions.
