# Testing Guide: Super Admin Authentication Fix

## Overview

This guide tests all authentication flows after fixing the JWT error:
- Super Admin (email/password)
- Driver (phone-based OTP)
- Vendor (phone-based OTP)

## Prerequisites

- Expo app running on port 8082
- Backend running on port 4000
- Fresh test accounts or ready-to-test accounts

---

## Test 1: Super Admin Login (Email/Password)

### Setup
1. Have a super admin account with:
   - Email: (valid email)
   - Password: (valid password)
   - Role: super_admin

### Test Steps

1. **Open app**
   - Should show role selection screen

2. **Select "Super Admin"**
   - Should show email + password login form

3. **Enter credentials**
   - Email: (valid super admin email)
   - Password: (valid password)

4. **Click "Login"**

### Expected Result ✅

- NO JWT error in console
- Console should show:
  ```
  LOG  Super Admin login with email: admin@example.com
  LOG  Super Admin authenticated successfully
  LOG  Unified setting user profile: {...}
  ```
- Should navigate to Super Admin Dashboard
- Can access admin features

### If Error Occurs ❌

- **"Invalid email or password"** → Check credentials are correct
- **"User not found"** → Check super admin account exists in Supabase
- **"Invalid JWT structure"** → Issue not fixed, check AuthContext.js
- **Other error** → Check backend logs and Supabase status

---

## Test 2: Driver Login (Phone-Based OTP)

### Setup
1. Have a driver account with:
   - Phone: 10-digit phone number (e.g., 9686314982)
   - Role: driver
   - Status: varies by test case

### Test Steps: New Driver (No Documents)

1. **Open app**
   - Should show role selection screen

2. **Select "Driver"**
   - Should show phone login form (no password field)

3. **Enter phone**
   - Phone: 9686314982

4. **Click "Login"**

### Expected Result ✅

- NO JWT error in console
- Console should show:
  ```
  LOG  OTP-verified login with phone: 9686314982
  LOG  User found in database: {...}
  LOG  Driver verification status: pending_review
  LOG  OTP user authenticated successfully
  ```
- Should show error alert: **"Please upload your documents first"**
- Does NOT login
- Can try again after uploading documents

### Test Steps: Driver with Submitted Docs (Pending Review)

1. Follow steps 1-4 above, but use a driver with documents submitted

### Expected Result ✅

- Console should show:
  ```
  LOG  Driver verification status: pending_review
  LOG  Documents submitted, waiting for admin approval
  LOG  OTP user authenticated successfully
  ```
- Should navigate to **WaitingForApprovalScreen**
- Can see "Check Status" and "Upload/View Documents" buttons

### Test Steps: Driver with Approved Docs

1. Follow steps 1-4 above, but use a driver with all docs approved

### Expected Result ✅

- Console should show:
  ```
  LOG  Driver verification status: approved
  LOG  Documents approved - allowing login to dashboard
  LOG  OTP user authenticated successfully
  ```
- Should navigate to **Driver Dashboard**
- Can accept trips and use all features

### Test Steps: Driver with Rejected Docs

1. Follow steps 1-4 above, but use a driver with rejected docs

### Expected Result ✅

- Console should show:
  ```
  LOG  Driver verification status: rejected
  ```
- Should show error alert: **"Your documents were rejected. Please re-upload and resubmit."**
- Does NOT login
- User must sign up again or use a different account

---

## Test 3: Vendor Login (Phone-Based OTP)

### Setup
1. Have a vendor account with:
   - Phone: 10-digit phone number
   - Role: vendor
   - Status: any

### Test Steps

1. **Open app**
   - Should show role selection screen

2. **Select "Vendor"**
   - Should show phone login form

3. **Enter phone**
   - Phone: (vendor's phone)

4. **Click "Login"**

### Expected Result ✅

- NO JWT error in console
- Console should show:
  ```
  LOG  OTP-verified login with phone: ...
  LOG  User found in database: {...}
  LOG  OTP user authenticated successfully
  ```
- Should navigate to **Vendor Dashboard**
- Can accept orders and use all features

---

## Test 4: Invalid Phone Number

### Test Steps

1. Select Driver role
2. Enter phone: 123 (invalid format)
3. Click Login

### Expected Result ✅

- Should show error: **"User not found. Please sign up first."**
- Does NOT crash

---

## Test 5: Non-Existent User

### Test Steps

1. Select Driver role
2. Enter phone: 9999999999 (valid format but doesn't exist)
3. Click Login

### Expected Result ✅

- Should show error: **"User not found. Please sign up first."**
- Does NOT crash

---

## Test 6: Wrong Super Admin Password

### Test Steps

1. Select Super Admin role
2. Enter email: (valid super admin email)
3. Enter password: wrongpassword123
4. Click Login

### Expected Result ✅

- Should show error: **"Invalid email or password"**
- Does NOT crash
- Can retry with correct password

---

## Console Log Verification

### Super Admin Success
```
LOG  Unified AuthContext: Attempting sign in - identifier: admin@example.com role: super_admin
LOG  Super Admin login with email: admin@example.com
LOG  Super Admin authenticated successfully
LOG  Unified setting user profile: {...}
```

### Driver Success
```
LOG  Unified AuthContext: Attempting sign in - identifier: 9686314982 role: driver
LOG  OTP-verified login with phone: 9686314982 role: driver
LOG  OTP user email: 9686314982@kushicabs.phone
LOG  User found in database: {...}
LOG  Authenticating OTP user with Supabase
LOG  OTP user authenticated successfully
```

### Driver No Documents
```
LOG  Driver verification status: pending_review
ERROR  Unified Sign in error: Please upload your documents first.
```

### Error Case
```
ERROR  Unified Sign in error: User not found. Please sign up first.
```

---

## Key Indicators of Success

- ✅ **No "Invalid JWT structure" errors**
- ✅ **Super admin can login with email/password**
- ✅ **Drivers/vendors can login with phone**
- ✅ **Proper navigation based on user role**
- ✅ **Document verification for drivers**
- ✅ **Clear error messages for failures**
- ✅ **Console logs show proper flow**
- ✅ **No app crashes**

---

## Key Indicators of Failure

- ❌ JWT structure error in console
- ❌ Super admin can't login
- ❌ Drivers can't login with phone
- ❌ Navigation doesn't work properly
- ❌ App crashes during login
- ❌ No console logs
- ❌ Silent failures

---

## Debugging

### If JWT error persists
1. Check `src/context/AuthContext.js` line ~160-180
2. Verify super admin path uses `signInWithPassword()`
3. Check that fake JWT token creation code is removed
4. Verify no `setSession()` calls with custom tokens

### If driver can't login
1. Check driver exists in `users` table
2. Check driver's auth account exists in Supabase auth
3. Verify phone-based email format: `{phone}@kushicabs.phone`
4. Check temporary password: `OTP-{phone}-kushicabs`

### If super admin can't login
1. Check email is correct
2. Verify password is correct
3. Check super admin role exists in `roles` table
4. Verify auth user has email/password auth method

### If navigation fails
1. Check role is being set correctly
2. Verify RootNavigator checks user.roles.name
3. Check DriverNavigator/AdminNavigator exist
4. Verify navigation state is updating

---

## Test Automation

To automate testing, create test accounts:

### Super Admin
```sql
-- Create super admin auth user
INSERT INTO auth.users (email, password_hash, email_confirmed_at)
VALUES ('admin@test.com', crypt('password123', gen_salt('bf')), NOW());

-- Create super admin profile
INSERT INTO users (id, email, role_id, full_name, is_active)
SELECT id, 'admin@test.com', 
  (SELECT id FROM roles WHERE name = 'super_admin'),
  'Test Admin', true
FROM auth.users WHERE email = 'admin@test.com';
```

### Driver
```sql
-- Create driver auth user (with phone-based email)
INSERT INTO auth.users (email, password_hash, email_confirmed_at)
VALUES ('9999999999@kushicabs.phone', 
  crypt('OTP-9999999999-kushicabs', gen_salt('bf')), NOW());

-- Create driver profile
INSERT INTO users (id, email, phone, role_id, full_name, is_active)
SELECT id, '9999999999@kushicabs.phone', '9999999999',
  (SELECT id FROM roles WHERE name = 'driver'),
  'Test Driver', true
FROM auth.users WHERE email = '9999999999@kushicabs.phone';
```

---

## Summary

All three authentication paths should work without JWT errors:
- ✅ Super Admin: email/password
- ✅ Driver: phone-based
- ✅ Vendor: phone-based

No fake JWT tokens, all real Supabase authentication.
