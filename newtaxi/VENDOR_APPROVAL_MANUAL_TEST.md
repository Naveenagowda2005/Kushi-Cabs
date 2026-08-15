# Vendor Approval - Manual Testing Guide

## Current Issue
Vendors still show "Waiting for Approval" screen even after documents are approved in the admin dashboard. The `overall_status` in `vendor_verification_status` table is not updating to 'approved'.

## Root Cause
The approval logic in AdminVendorVerificationDashboard might not be:
1. Creating the `vendor_verification_status` record if it doesn't exist
2. Checking the correct documents for approval
3. Updating the database correctly

## Manual Testing Steps

### Step 1: Check Database State
Run this SQL query in Supabase to see what's in the database:

```sql
SELECT 
  u.id, u.full_name, u.phone,
  vvs.overall_status,
  vvs.submitted_at,
  vvs.approved_at,
  (SELECT COUNT(*) FROM (
    SELECT jsonb_each(documents) AS doc 
    FROM vendor_documents vd 
    WHERE vd.user_id = u.id
  ) t WHERE doc.value->>'status' = 'approved') as approved_docs,
  (SELECT COUNT(*) FROM (
    SELECT jsonb_each(documents) AS doc 
    FROM vendor_documents vd 
    WHERE vd.user_id = u.id
  ) t WHERE doc.value->>'status' = 'pending') as pending_docs
FROM users u
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.role = 'vendor'
ORDER BY vvs.created_at DESC NULLS LAST;
```

### Step 2: Check Vendor Documents
```sql
SELECT 
  user_id,
  documents
FROM vendor_documents
ORDER BY updated_at DESC
LIMIT 1;
```

### Step 3: Manually Approve Vendor (Testing)
If all documents show as 'approved' but overall_status is still 'pending', manually update it:

```sql
UPDATE vendor_verification_status
SET 
  overall_status = 'approved',
  approved_at = NOW(),
  verified_at = NOW()
WHERE user_id = (
  SELECT id FROM users 
  WHERE phone = '9686314982' 
  AND role = 'vendor'
);

-- Also update users table
UPDATE users
SET verification_status = 'approved'
WHERE phone = '9686314982' AND role = 'vendor';
```

### Step 4: Test on App
1. After manually updating the database above
2. Go back to the vendor app
3. Click "Check Status" button (newly added)
4. Should see approval alert within 2 seconds and redirect to dashboard

## What Should Happen (Ideal Flow)

1. **Vendor submits documents** → `vendor_verification_status` record created with `overall_status = 'pending'`
2. **Super admin approves each document** → Each document's `status` field set to 'approved'
3. **Last document approved** → System checks if ALL 4 required docs are approved
4. **All approved** → Updates `vendor_verification_status` to `overall_status = 'approved'`
5. **Vendor polling** → Detects change within 1-2 seconds
6. **Show alert** → "Your account has been approved!"
7. **Redirect** → Vendor sees dashboard instead of waiting screen

## Current Implementation Details

### Frontend Polling
- **VendorNavigator.js**: Polls every 1 second
- **VendorWaitingForApprovalScreen.js**: Polls every 2 seconds when screen is visible
- Logs: Look for `VendorNavigator: Status from DB:` in console

### Backend Approval Logic
- **AdminVendorVerificationDashboard.js**: When approve button is clicked on last document
- Should check if ALL 4 documents are approved
- Should update `vendor_verification_status` table
- Should update `users.verification_status` field

## Debugging Console Logs

When testing, look for these logs:

```
VendorNavigator: Status from DB: approved ✅
VendorNavigator: FULL RECORD: {...} ✅
VendorNavigator: ✅ Status CHANGED from pending to approved ✅
```

If these don't appear, the issue is either:
1. Database not being updated (admin side)
2. Vendor doesn't exist in `vendor_verification_status` table
3. Query failing silently

## Quick Fix Options

### Option A: Use the "Force Sync" Button
- Admin can use the "Force Sync All Approved Vendors" button
- This checks all pending vendors and auto-approves those with all docs approved

### Option B: Manual Database Update
- Run the SQL from Step 3 above
- Vendor will see approval alert on next poll (1-2 seconds)

### Option C: Developer Fix
- Add better error handling in admin dashboard approve logic
- Ensure `vendor_verification_status` record is created/updated atomically
- Add `console.log` statements to track the update flow

## Files to Review

1. `newtaxi/apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js` - Approval logic
2. `newtaxi/apps/unified/src/navigation/VendorNavigator.js` - Polling logic
3. `newtaxi/supabase/migrations/051_vendor_documents_verification.sql` - Database schema

---

**Last Updated**: June 5, 2026
**Status**: Needs Investigation
