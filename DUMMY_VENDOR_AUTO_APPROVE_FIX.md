# Dummy Vendor Auto-Approval Fix

## Problem
Dummy vendors created via `/admin/create-dummy-vendor` were still being shown the "Upload Documents" screen instead of being auto-approved to the dashboard.

## Root Cause
The `VendorNavigator` was checking the `vendor_verification_status` table for the approval status. When that record didn't exist or when the status wasn't found, it defaulted to `not_started` without checking the fallback `users.verification_status` field.

## Solution
Updated `VendorNavigator.js` to properly handle the fallback verification status:

### Backend Setup (Already Working)
The `/admin/create-dummy-vendor` endpoint correctly sets:
1. `users.verification_status = 'approved'` (primary field)
2. `vendor_verification_status.overall_status = 'approved'` (secondary, if table allows)

### Frontend Logic (Fixed)
Updated the verification check in `VendorNavigator.js`:

**Old logic:**
```javascript
if (error?.code === 'PGRST116') {
  // No record found - immediately set to not_started
  setVerificationStatus('not_started');
}
```

**New logic:**
```javascript
if (error?.code === 'PGRST116') {
  // No record found - check users.verification_status fallback
  if (user?.verification_status === 'approved') {
    setVerificationStatus('approved');  // Dummy vendor
    return;
  }
  setVerificationStatus('not_started');  // Regular vendor
}
```

## Flow for Dummy Vendors
1. Super admin creates dummy vendor via `/admin/create-dummy-vendor`
2. Backend sets both `users.verification_status` and `vendor_verification_status` to `'approved'`
3. Dummy vendor logs in
4. `VendorNavigator` checks `vendor_verification_status` → no error, record exists → status = `'approved'`
5. OR if only `users.verification_status` is set → status = `'approved'` via fallback
6. Vendor bypasses document upload → goes straight to dashboard

## Flow for Regular Vendors
1. Vendor signs up, not created via admin
2. Only `users.verification_status` exists initially (not approved)
3. `VendorNavigator` checks `vendor_verification_status` → PGRST116 (no record)
4. Checks fallback `users.verification_status` → not `'approved'`
5. Sets status to `'not_started'`
6. Vendor shown Upload Documents screen

## Files Modified
- `newtaxi/apps/unified/src/navigation/VendorNavigator.js` - Enhanced fallback verification logic

## Testing
1. Create dummy vendor via super admin dashboard using `/admin/create-dummy-vendor`
2. Login with dummy vendor credentials
3. Should see dashboard immediately, NOT upload documents screen
4. Verify logs show: "Dummy vendor detected via users.verification_status=approved"

## Verification Query
```sql
SELECT 
  u.id as user_id,
  u.phone,
  u.full_name,
  u.verification_status,
  v.id as vendor_id,
  v.company_name,
  vvs.overall_status
FROM users u
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.phone = 'DUMMY_VENDOR_PHONE'
  AND u.full_name LIKE 'DUMMY%';
```

Expected:
- `u.verification_status` = `'approved'`
- `v.company_name` starts with `'DUMMY'`
- Vendor can login and access dashboard immediately
