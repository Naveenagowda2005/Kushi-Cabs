# OTP Login & Registration Troubleshooting

## Current Issue
- ✅ User can login via OTP (phone number authentication works)
- ❌ Registration fails - user profile can't be created or fetched
- App shows: "User has session but no profile, needs to complete registration"

## Root Cause
The issue is **Row Level Security (RLS) policies** in Supabase. When OTP users try to:
1. INSERT their profile into the `users` table → BLOCKED by RLS
2. SELECT their profile back → BLOCKED by RLS

## Quick Fix (IMPORTANT!)

Go to your Supabase Dashboard:
1. Open **SQL Editor**
2. Copy all the SQL from: `FIX_OTP_REGISTRATION_RLS.sql`
3. Run it
4. Test registration again

## What the Fix Does
- Allows unauthenticated/OTP users to INSERT their own profiles
- Allows users to read their own profiles
- Keeps super admins able to see all profiles

## After Running the Fix
1. Restart both backend & frontend:
   ```
   npm start (in both /backend and /apps/unified)
   ```
2. Try logging in again with OTP
3. Complete the registration form (Full Name, Business/License info)
4. Click "Next Step"

## If Registration Still Fails
Check your browser/emulator console logs for:
- **"RLS policy prevents insert"** → Need to fix RLS
- **"No authenticated user"** → Session issue
- **"Network error"** → Backend connectivity issue (verify IP is `192.168.1.110:4000`)

## Alternative: Disable RLS Temporarily (FOR TESTING ONLY)
If you want to temporarily disable RLS to test:

```sql
-- TEMPORARY - For testing only
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
```

Then re-enable it with proper policies once registration works.
