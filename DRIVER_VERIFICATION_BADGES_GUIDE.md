# Driver Verification Badges - Implementation Guide

## Overview
Added "NEW" and "RE-UPLOAD" badges to the Super Admin Driver Verification Dashboard, matching the vendor verification UI pattern.

## Changes Made

### 1. Database Migration (069_driver_re_verification_flag.sql)
**Purpose:** Track when drivers re-upload documents after being previously approved

**Changes:**
- Added `is_re_verification` BOOLEAN column to `driver_verification_status` table
- Created trigger function `detect_driver_re_verification()` that:
  - Automatically sets `is_re_verification = TRUE` when a driver who previously had approved documents re-submits
  - Sets `is_re_verification = FALSE` for new drivers
- Updated existing records: any pending/rejected driver with approved documents is marked as re-verification

**Location:** `newtaxi/supabase/migrations/069_driver_re_verification_flag.sql`

### 2. Frontend Changes (AdminVerificationDashboard.js)

#### Badge Logic
```javascript
// Check if driver is re-verification (was already approved, now re-uploading)
// Fallback: if any document is 'approved', this is a re-verification
const hasAnyApprovedDoc = verification.documents?.some(
  doc => doc?.status === 'approved'
);
const isReVerification = verification.is_re_verification === true || hasAnyApprovedDoc;
```

#### Badge Display
- **NEW badge** (green): For drivers submitting documents for the first time
  - Icon: `sparkles-outline`
  - Color: #4caf50 (green)
  - Background: semi-transparent green
  
- **RE-UPLOAD badge** (orange): For drivers who were already approved and are re-uploading
  - Icon: `refresh-circle-outline`
  - Color: #ff9800 (orange)
  - Background: semi-transparent orange

#### Re-verification Banner
When a driver has RE-UPLOAD badge, an informational banner appears:
- Shows orange accent border
- Text: "This driver is already approved. They re-uploaded one or more documents for your review. Their dashboard access continues uninterrupted."
- Informs super admin that driver keeps access during re-verification

## How It Works

### For New Drivers
1. Driver uploads documents for the first time
2. `is_re_verification = FALSE` (set by trigger)
3. Dashboard shows **"NEW"** badge (green with sparkles icon)
4. No re-verification banner shown

### For Existing Approved Drivers Re-uploading
1. Driver was previously approved (has documents with status='approved')
2. Driver re-uploads rejected or updated documents
3. `is_re_verification = TRUE` (set by trigger, detects approved docs)
4. Dashboard shows **"RE-UPLOAD"** badge (orange with refresh icon)
5. Re-verification banner displays explaining driver keeps dashboard access

## Installation Steps

### Step 1: Apply Database Migration
Run the SQL in Supabase SQL Editor:
```sql
-- Copy contents of newtaxi/supabase/migrations/069_driver_re_verification_flag.sql
-- Paste into Supabase SQL Editor and execute
```

Or use the file: `RUN_MIGRATION_069.sql`

### Step 2: Rebuild Frontend
The UI changes are already in the code. Just rebuild:
```bash
cd newtaxi/apps/unified
npm run build
# or for Expo
expo build:android
expo build:ios
```

## Testing Checklist

### Test Case 1: New Driver
- [ ] Create new driver account
- [ ] Upload documents
- [ ] Go to Super Admin > Verify Drivers
- [ ] Verify "NEW" badge shows (green with sparkles)
- [ ] Verify no re-verification banner shown

### Test Case 2: Driver Re-uploading (after rejection)
- [ ] Have existing approved driver
- [ ] Reject one of their documents
- [ ] Driver re-uploads the rejected document
- [ ] Go to Super Admin > Verify Drivers
- [ ] Verify "RE-UPLOAD" badge shows (orange with refresh)
- [ ] Verify re-verification banner displays
- [ ] Verify driver can still access dashboard

### Test Case 3: Driver Re-uploading (after approval)
- [ ] Have existing fully approved driver
- [ ] Driver decides to update a document
- [ ] Driver re-uploads the document
- [ ] Go to Super Admin > Verify Drivers
- [ ] Verify "RE-UPLOAD" badge shows (orange with refresh)
- [ ] Verify re-verification banner displays
- [ ] Verify driver maintains dashboard access

## UI Components

### Badge Styles
```javascript
newBadge: {
  backgroundColor: '#4caf5020',  // Green with transparency
  borderColor: '#4caf5060',
  borderRadius: 6,
  paddingHorizontal: 6,
  paddingVertical: 2,
}

reUploadBadge: {
  backgroundColor: '#ff980020',  // Orange with transparency
  borderColor: '#ff980060',
  borderRadius: 6,
  paddingHorizontal: 6,
  paddingVertical: 2,
}
```

### Banner Styling
```javascript
reVerifyBanner: {
  backgroundColor: '#ff980015',   // Light orange
  borderLeftWidth: 3,
  borderLeftColor: '#ff9800',     // Orange accent
  borderRadius: 8,
  padding: 10,
  marginBottom: 12,
}
```

## File Changes Summary
- **AdminVerificationDashboard.js**: Added badge logic, rendering, and styles
- **069_driver_re_verification_flag.sql**: Database migration
- **RUN_MIGRATION_069.sql**: Migration script for manual execution

## Database Schema Update
```sql
ALTER TABLE driver_verification_status
ADD COLUMN IF NOT EXISTS is_re_verification BOOLEAN DEFAULT FALSE;
```

## Backend Sync
The trigger automatically handles the flag:
- On document submission: checks if driver has any approved documents
- If yes: sets `is_re_verification = TRUE`
- If no: sets `is_re_verification = FALSE`

No backend changes needed - database trigger handles all logic.

## Notes
- The feature uses fallback logic: if `is_re_verification` is NULL, checks for approved documents
- This ensures backward compatibility with existing drivers
- Banner only shows when `isReVerification` is TRUE
- Badge displays on all drivers in pending/approved/rejected tabs
