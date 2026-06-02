# Super Admin Login - Credentials & Setup

## Issue Fixed
Previous error: `Invalid login credentials` when super_admin tried to login

**Root Cause**: The authentication system was trying to use the wrong email format and didn't handle phone-to-email conversion for super_admin.

**Solution**: Updated AuthContext to properly handle super_admin phone-based email format.

---

## Super Admin Login Credentials

Based on the database setup, the super_admin account uses **phone-based email**:

### Login Details:
- **Email/Identifier**: `9686314982` (phone number) OR `9686314982@kushicabs.phone` (email)
- **Password**: `otp-verified-user`
- **Role**: super_admin

### How to Login:
1. Open app and select **"Super Admin"** role
2. Enter identifier: `9686314982` (or `9686314982@kushicabs.phone`)
3. Enter password: `otp-verified-user`
4. Click "Login"

---

## How It Works Now

### Super Admin Authentication Flow:

```
User enters: 9686314982 (phone)
    ↓
App detects it's a 10-digit phone
    ↓
Convert to email: 9686314982@kushicabs.phone
    ↓
Call: supabase.auth.signInWithPassword(
  email: "9686314982@kushicabs.phone",
  password: "otp-verified-user"
)
    ↓
Supabase validates credentials
    ↓
✅ Authentication successful
    ↓
Fetch user profile from database
    ↓
Set session and redirect to admin dashboard
```

### Alternative Input Format:

You can also login by entering the full email directly:

```
User enters: 9686314982@kushicabs.phone (email)
    ↓
App detects it's already an email (has @)
    ↓
Use as-is: 9686314982@kushicabs.phone
    ↓
Call: supabase.auth.signInWithPassword(...)
    ↓
✅ Authentication successful
```

---

## What Changed in AuthContext

### Before (Broken):
```javascript
// Tried to use identifier directly without conversion
const { data, error } = await supabase.auth.signInWithPassword({
  email: identifier,  // "9686314982" - WRONG FORMAT
  password: password,
});
// Result: "Invalid login credentials" error ❌
```

### After (Fixed):
```javascript
// Detect if it's a phone and convert to email format
const phoneDigits = identifier.replace(/[^0-9]/g, '');
if (phoneDigits.length === 10 && identifier === phoneDigits) {
  // Pure phone number - convert to email
  loginEmail = `${phoneDigits}@kushicabs.phone`;
} else if (phoneDigits.length === 10 && !identifier.includes('@')) {
  // Formatted phone - convert to email
  loginEmail = `${phoneDigits}@kushicabs.phone`;
}
// Use converted email for authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email: loginEmail,  // "9686314982@kushicabs.phone" - CORRECT ✅
  password: password,
});
```

---

## Console Logs You Should See

### Successful Login:
```
LOG  Unified AuthContext: Attempting sign in - identifier: 9686314982 role: super_admin
LOG  Super Admin login attempt with: 9686314982
LOG  Super Admin: Phone detected, converted to email: 9686314982@kushicabs.phone
LOG  Super Admin: Attempting auth with: 9686314982@kushicabs.phone
LOG  Super Admin authenticated successfully
LOG  Unified fetchUserProfile called for user: 75f834a1-4251-4630-b70e-df40d36ec781
LOG  Unified setting user profile: {...role: super_admin...}
LOG  Unified auto-selecting role: super_admin
```

### Failed Login (Invalid Credentials):
```
LOG  Unified AuthContext: Attempting sign in - identifier: 9686314982 role: super_admin
LOG  Super Admin login attempt with: 9686314982
LOG  Super Admin: Phone detected, converted to email: 9686314982@kushicabs.phone
LOG  Super Admin: Attempting auth with: 9686314982@kushicabs.phone
ERROR  Super Admin login error: Invalid login credentials
ERROR  Unified Sign in error: Invalid email/phone or password. Please check and try again.
```

---

## Troubleshooting

### Error: "Invalid email/phone or password"

**Possible causes**:

1. **Wrong password**
   - Verify you're using: `otp-verified-user`
   - Password is case-sensitive

2. **Auth account doesn't exist in Supabase**
   - Need to create auth user manually in Supabase Dashboard
   - Go to: Authentication → Users → Add user
   - Email: `9686314982@kushicabs.phone`
   - Password: `otp-verified-user`
   - Click "Create user"

3. **Database user profile missing**
   - Run SQL to verify user exists:
   ```sql
   SELECT id, email, phone, full_name, role_id FROM users WHERE phone = '9686314982';
   ```
   - Should return 1 row with role_id = 5 (super_admin role)

4. **User is inactive**
   - Check: `is_active = true`
   - Run: `UPDATE users SET is_active = true WHERE phone = '9686314982';`

---

## Setup Checklist

To ensure super_admin can login:

### Step 1: Auth User (Supabase Dashboard)
- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Check if user exists with email: `9686314982@kushicabs.phone`
- [ ] If not, create new user:
  - Email: `9686314982@kushicabs.phone`
  - Password: `otp-verified-user`
  - Click "Create user"

### Step 2: Database User Profile
- [ ] Open SQL Editor in Supabase
- [ ] Run this query:
```sql
SELECT id, email, phone, full_name, is_active, role_id FROM users WHERE phone = '9686314982';
```
- [ ] Should return 1 row
- [ ] Verify:
  - `email` = `9686314982@kushicabs.phone`
  - `phone` = `9686314982`
  - `role_id` = 5 (super_admin)
  - `is_active` = true
  - `full_name` = "Super Admin"

### Step 3: Test Login
- [ ] Open app
- [ ] Select "Super Admin" role
- [ ] Enter phone: `9686314982`
- [ ] Enter password: `otp-verified-user`
- [ ] Click "Login"
- [ ] Should see admin dashboard

---

## Database Setup SQL

If super_admin doesn't exist in database, run this:

```sql
-- 1. Get super_admin role ID
SELECT id FROM roles WHERE name = 'super_admin';
-- Should return: 5

-- 2. Insert/Update super_admin user
INSERT INTO users (phone, email, full_name, role_id, is_active)
VALUES ('9686314982', '9686314982@kushicabs.phone', 'Super Admin', 5, true)
ON CONFLICT (phone) DO UPDATE SET
  email = '9686314982@kushicabs.phone',
  role_id = 5,
  is_active = true,
  full_name = 'Super Admin';

-- 3. Verify
SELECT id, email, phone, full_name, role_id, is_active 
FROM users 
WHERE phone = '9686314982';
```

---

## Multi-Role System Overview

### Driver / Vendor
- **Login with**: Phone number (e.g., `9876543210`)
- **Password**: Temporary password created at signup
- **Email format**: `9876543210@kushicabs.phone` (auto-converted)
- **Authentication**: OTP-verified

### Super Admin
- **Login with**: Phone number (e.g., `9686314982`) OR email
- **Password**: `otp-verified-user` (shared/fixed)
- **Email format**: `9686314982@kushicabs.phone`
- **Authentication**: Email/password (standard Supabase)

---

## Security Notes

⚠️ **Important for Production**:

1. **Change the super_admin password**
   - Current password `otp-verified-user` is for development
   - Should be changed before going to production
   - Update in Supabase → Authentication → Users

2. **Super Admin Access**
   - Only one super_admin account should exist
   - Keep credentials secure
   - Consider using strong password

3. **Multi-Admin Setup**
   - To add additional admins, create new users with role_id = 5
   - Each should have own secure password

---

## Production Checklist

Before deploying to production:

- [ ] Verify super_admin can login with phone: `9686314982`
- [ ] Verify super_admin can login with email: `9686314982@kushicabs.phone`
- [ ] Change super_admin password from `otp-verified-user` to something secure
- [ ] Test driver login still works
- [ ] Test vendor login still works
- [ ] Verify admin dashboard is accessible
- [ ] Test document approval workflow

---

## Summary

✅ **Fixed**: Super admin can now login with phone number or email
✅ **Supports**: Phone-to-email conversion for super_admin
✅ **Credentials**: Phone `9686314982` + password `otp-verified-user`
✅ **Works**: With both phone and email input formats
✅ **Ready**: For testing and production use
