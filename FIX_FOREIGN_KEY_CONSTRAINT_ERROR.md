# Fix: Foreign Key Constraint Error on User Profile Creation

## Problem Summary

During registration, users were encountering this error:

```
ERROR: insert or update on table "users" violates foreign key constraint "users_id_fkey"
Key (id)=(3a8ea96a-e538-4f47-b1e7-6dc0f695f5fe) is not present in table "users".
```

This error occurs because the `users` table has a PRIMARY KEY that references the Supabase `auth.users` table with an `ON DELETE CASCADE` constraint:

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone      TEXT UNIQUE NOT NULL,
  ...
);
```

## Root Cause

The error happens when `createUserProfile()` tries to insert a user record with an ID that doesn't exist in the Supabase `auth.users` table. This can occur if:

1. The auth account creation fails silently on the backend
2. The session context is lost or not properly maintained between screens
3. The userId from `incompleteSignupUserId` becomes stale or invalid

## Solution Applied

Added validation and better error handling to `createUserProfile()` in `AuthContext.js`:

### Changes Made:

1. **Added Session Validation**
   ```javascript
   // Verify we have a valid session/user context
   if (!session?.user) {
     throw new Error('No valid session. Please try signing up again.');
   }
   ```

2. **Specific Foreign Key Error Handling**
   ```javascript
   if (error) {
     // Check if it's a foreign key constraint error
     if (error.code === '23503' && error.message.includes('users_id_fkey')) {
       console.error('Unified createUserProfile: Foreign key error - auth user may not exist');
       throw new Error(
         'User authentication failed. The auth account was not properly created. Please try registering again.'
       );
     }
     throw error;
   }
   ```

3. **Improved Error Messages**
   - Users now see a clear message that auth account creation failed
   - Suggests retrying the registration process
   - Better logging for debugging

## How to Test

1. Go through the signup flow (phone verification, OTP, etc.)
2. Fill out registration details
3. If the foreign key error occurs, it will now show:
   - **"User authentication failed. The auth account was not properly created. Please try registering again."**

## Debugging Steps if Error Persists

If users still encounter this error after the fix:

1. Check backend logs to see if `/admin/create-driver-account` endpoint is failing
2. Verify the Supabase auth account is being created
3. Check if the session is being properly maintained in AuthContext
4. Monitor the `userId` values being logged to ensure they're valid UUIDs

## Files Modified

- `newtaxi/apps/unified/src/context/AuthContext.js` (createUserProfile function)

## Related Database Schema

The `users` table definition requires the auth.users account to exist first:
```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
);
```

This means auth.users must have a record with matching ID before any user profile can be created.
