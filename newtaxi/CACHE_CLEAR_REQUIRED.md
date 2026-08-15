# ⚠️ Cache Clear Required

## Problem

The app is still showing old AsyncStorage logs even though the code has been updated to use real Supabase JWT:

```
LOG  AuthProvider: Checking AsyncStorage for superAdminSession: true  ❌ OLD CODE
LOG  AuthProvider: Found super admin session in AsyncStorage  ❌ OLD CODE
```

But the code file now shows:
```javascript
// ✅ NEW CODE - No AsyncStorage references
const { data: { session }, error } = await supabase.auth.getSession();
```

## Why This Happens

The app is a React Native/Expo app running in a local development environment or emulator. The JavaScript bundle is cached, so old code is still running even though files have been updated.

## Solution

You need to **hard refresh the app** to clear the cache and reload the new code.

### For Web (Expo in Browser)
Press: **`Ctrl + Shift + R`** (Windows) or **`Cmd + Shift + R`** (Mac)

### For Mobile (Expo CLI)
Option 1: Close the Expo app completely and restart it
Option 2: In the Expo terminal, press **`r`** to reload
Option 3: Press **`c`** to clear cache and reload

### For Native Android Emulator
Option 1: Clear app cache in Android settings
Option 2: Uninstall and reinstall the app
Option 3: Press **`r`** in Expo CLI

## What the New Code Should Show After Cache Clear

After hard refresh, logs should look like:

```
LOG  AuthProvider: initAuth starting...
LOG  AuthProvider: Got Supabase session result: { hasSession: false, error: undefined }
LOG  AuthProvider: No Supabase session, clearing everything
LOG  AuthProvider: Auth listener set up successfully
```

✅ **No AsyncStorage messages** - All session handling via Supabase JWT

## After Cache Clear - Expected Behavior

### First Login (Fresh App)
```
1. Enter phone number
2. Verify OTP
3. Supabase returns real JWT session
4. Super admin dashboard shown
5. Logs show: "Super Admin: Got real Supabase JWT session"
```

### Restart App (Session Still Valid)
```
1. App starts
2. Supabase checks for existing JWT
3. Session found and restored
4. Super admin dashboard shown immediately
5. No need to login again
6. hasSession() returns true
```

### Logout (Clear Session)
```
1. Click logout
2. supabase.auth.signOut() called
3. JWT cleared from Supabase
4. App shows role selection screen
```

## Files Changed

Only one file was modified:
- `src/context/AuthContext.js`

All changes:
- ✅ Removed AsyncStorage import
- ✅ Simplified `initAuth()` - only uses Supabase
- ✅ Updated `signIn()` - uses real JWT for super admin
- ✅ Simplified auth listener - no special mock session handling
- ✅ Simplified `signOut()` - just calls Supabase

## How to Know It Worked

Check the logs after hard refresh. You should see:

✅ `LOG  AuthProvider: Got Supabase session result:`
✅ No "AsyncStorage" messages
✅ `LOG  AuthProvider: Auth listener set up successfully`
✅ Super admin session persists on app reload
✅ `hasSession()` returns `true`

---

## After Cache Clear Instructions

1. **Hard refresh the app** (Ctrl+Shift+R on web, `r` in Expo CLI on mobile)
2. **Test super admin login flow**
3. **Check logs** - should show real JWT, not AsyncStorage
4. **Restart app** - session should restore automatically
5. **Test logout** - session should clear properly

Then the real Supabase JWT authentication will be active!

