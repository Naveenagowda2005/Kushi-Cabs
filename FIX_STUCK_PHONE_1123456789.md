# Fix: Phone Number 1123456789 Stuck in Registration

## Problem

The phone number `1123456789` is stuck during registration. The user can't proceed past a certain point.

## Root Cause Analysis

The registration flow has multiple stages:

1. **SignUpScreen** → OTP verification
2. **Backend API** → `/admin/create-driver-account` creates auth account
3. **RegisterScreen** → `createUserProfile()` creates user profile in database
4. **Issue** → If step 3 fails, auth user exists but user profile doesn't → registration is stuck

The flow is:
```
SignUp (OTP) → Backend Creates Auth User → RegisterScreen Profile Creation → STUCK HERE
```

## What Happened with 1123456789

Most likely:
1. ✅ OTP was sent successfully
2. ✅ OTP was verified
3. ✅ Backend created auth account (`1123456789@kushicabs.phone`)
4. ❌ RegisterScreen tried to create user profile BUT failed (foreign key or other error)
5. 🔒 Now stuck: Auth user exists but can't be deleted by user, and can't re-register because email/phone already exists

## How to Unstick This Number

### Option 1: Clean Reset (Recommended)

**Step 1: Delete Application Data**
Run this SQL against your database:

```sql
-- Disable triggers
ALTER TABLE drivers DISABLE TRIGGER ALL;
ALTER TABLE vendors DISABLE TRIGGER ALL;
ALTER TABLE wallets DISABLE TRIGGER ALL;

-- Delete all related records
DELETE FROM active_sessions WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

DELETE FROM wallets WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

DELETE FROM drivers WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

DELETE FROM vendors WHERE user_id IN (
  SELECT id FROM users WHERE phone = '1123456789'
);

DELETE FROM users WHERE phone = '1123456789';

-- Re-enable triggers
ALTER TABLE drivers ENABLE TRIGGER ALL;
ALTER TABLE vendors ENABLE TRIGGER ALL;
ALTER TABLE wallets ENABLE TRIGGER ALL;
```

**Step 2: Delete Auth User**

The auth user cannot be deleted via SQL (Supabase manages it). You must:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search for user with email: `1123456789@kushicabs.phone`
3. Click on the user
4. Click the **⋮ (three dots)** menu
5. Select **Delete User**
6. Confirm deletion

**Step 3: User Can Re-register**

After both deletions, the user can start fresh signup with phone number `1123456789`.

### Option 2: Force Update (If you want to keep auth user)

If you need to keep the auth user but fix the profile:

```sql
-- Get the auth user ID from Supabase dashboard or logs
-- Replace ACTUAL_UUID_HERE with the real auth user ID

INSERT INTO users (id, phone, email, role_id, full_name, is_active, created_at)
VALUES (
  'ACTUAL_UUID_HERE',           -- Auth user UUID
  '1123456789',
  '1123456789@kushicabs.phone',
  (SELECT id FROM roles WHERE name = 'driver'),
  'Stuck User',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  phone = '1123456789',
  is_active = true;

-- Verify
SELECT * FROM users WHERE phone = '1123456789';
```

## Prevention: Better Error Handling

The fix implemented in AuthContext.js (from previous task) now:

1. ✅ Validates session before creating profile
2. ✅ Catches foreign key errors specifically
3. ✅ Shows clear error message to user
4. ✅ Allows user to retry registration

This prevents future registrations from getting stuck.

## Monitoring for Stuck Users

To find all stuck registrations in the future:

```sql
-- Find auth users who don't have a profile in users table
-- This requires checking Supabase admin to list auth users
-- Then matching against users table

-- Check for orphaned users (shouldn't happen after fix)
SELECT phone, email FROM users WHERE is_active = false;
```

## Backend Improvements Needed

Consider adding to the backend `/admin/create-driver-account` endpoint:

1. **Timeout handling** - Ensure auth creation completes
2. **Rollback on failure** - Delete auth user if profile creation fails
3. **Status tracking** - Track which step of signup the user completed
4. **Recovery endpoint** - Allow retrying profile creation if auth user exists but profile doesn't

## Files Referenced

- `newtaxi/apps/unified/src/context/AuthContext.js` (createUserProfile)
- `newtaxi/apps/unified/src/screens/auth/SignUpScreen.js` (signup flow)
- `backend/routes/admin.js` (create-driver-account endpoint)

## Testing After Fix

1. Register new user with test phone
2. Complete all steps including OTP
3. Verify profile created successfully
4. Check database that user exists in both auth and users table
