# Driver Signup Flow - Complete Fix

## Problem
After a new driver enters their phone number, requests OTP, verifies the OTP, and clicks "Verify & Create Account", the app was incorrectly showing the **Login screen** instead of the **Registration screen** where the driver needs to enter their full name, license number, and vehicle details.

### Root Cause
The signup flow had multiple issues:

1. **Navigation Race Condition**: `SignUpScreen` was manually navigating with `navigation.reset()` before the authentication state in the context was updated. This caused the navigation to stack incorrectly.

2. **Missing Session Update**: The `signUp()` function was returning success but not properly updating the auth context's session state, so the RootNavigator didn't know the user had a session without a profile.

3. **AuthNavigator Initialization**: When AuthNavigator initialized, it wasn't passing the phone number to the Register screen, and it wasn't properly detecting the incomplete signup state.

## Solutions Implemented

### 1. Fixed AuthContext.js - signUp Function
**Changed**: Simplified the error handling to cleanly return success when auth user already exists
**Result**: Cleaner state management without trying to manually set session

```javascript
if (error.message && error.message.includes('already registered')) {
  console.log('Unified AuthContext: Auth user already exists (incomplete signup)...');
  return { data: { user: { email }, identities: [] }, error: null };
}
```

### 2. Fixed SignUpScreen.js - Navigation Flow
**Changed**: Removed manual `navigation.reset()` and instead poll for auth session update
**Why**: Allows Supabase auth listener to trigger the state change, which causes RootNavigator to automatically show Register screen
**Implementation**:
- After `signUp()` returns success, wait (with timeout) for Supabase auth session to be set
- Let the context state change trigger navigation naturally
- If session not ready within timeout, navigate directly to Register with phone params

```javascript
// Wait for auth session to be updated
for (let i = 0; i < 30; i++) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.email?.endsWith('@kushicabs.phone')) {
    sessionReady = true;
    break;
  }
  await new Promise(r => setTimeout(r, 100));
}
```

### 3. Enhanced AuthNavigator.js - Phone Extraction
**Changed**: Added function to extract phone from auth email (format: `{phone}@kushicabs.phone`)
**Why**: So Register screen gets the phone even without explicit route params
**Implementation**:
```javascript
const getPhoneFromEmail = () => {
  const email = session?.user?.email;
  if (email && email.endsWith('@kushicabs.phone')) {
    return email.replace('@kushicabs.phone', '');
  }
  return '';
};
```

Pass this to Register screen:
```javascript
initialParams={{ role: selectedRole, phone: getPhoneFromEmail() }}
```

### 4. Enhanced RegisterScreen.js - Phone Fallback
**Changed**: Added fallback to extract phone from auth session if not in route params
**Why**: Ensures phone is always available, whether coming from SignUp or direct navigation
```javascript
if (!phone && session?.user?.email?.endsWith('@kushicabs.phone')) {
  phone = session.user.email.replace('@kushicabs.phone', '');
}
```

### 5. Fixed SignUpScreen.js - Added Imports
**Added**: Import for `supabase` to allow polling for session updates

## Flow After Fix

1. ✅ User selects "Create Driver Account" → Role selection confirmed
2. ✅ Shown SignUpScreen with phone input
3. ✅ Enters phone & requests OTP
4. ✅ Enters OTP code & clicks "Verify & Create Account"
5. ✅ SignUpScreen calls `signUp()`
6. ✅ `signUp()` returns success
7. ✅ SignUpScreen polls for Supabase auth session update
8. ✅ Auth session is set by Supabase listener
9. ✅ AuthContext triggers re-render of RootNavigator
10. ✅ RootNavigator detects `hasSession() && !hasUser()` condition
11. ✅ RootNavigator shows AuthNavigator
12. ✅ AuthNavigator initializes with Register as initial screen
13. ✅ Register screen shown with phone pre-filled from auth email
14. ✅ Driver enters full name, license number, vehicle number
15. ✅ Clicks "Next Step" → Navigates to Document Upload

## Testing Checklist

- [ ] Select "Create Driver Account"
- [ ] Enter any 10-digit phone number (e.g., `8970565756`)
- [ ] Click "Send OTP"
- [ ] Receive OTP via SMS (or use test OTP from backend)
- [ ] Enter OTP code
- [ ] Click "Verify & Create Account"
- [ ] **VERIFY**: Should see Register screen (not Login)
- [ ] Verify phone number is pre-filled
- [ ] Fill in full name, license number, vehicle number
- [ ] Click "Next Step"
- [ ] Should see Document Upload screen

## Key Files Modified

1. `src/context/AuthContext.js` - Simplified signup error handling
2. `src/screens/auth/SignUpScreen.js` - Added poll-and-wait logic, added imports
3. `src/navigation/AuthNavigator.js` - Added phone extraction function
4. `src/screens/auth/RegisterScreen.js` - Added phone fallback logic

## Technical Details

### Auth Email Format
- **Format**: `{10-digit-phone}@kushicabs.phone`
- **Example**: `9686314982@kushicabs.phone`
- This format is used throughout the system for driver/vendor authentication

### Session Flow
- When signup succeeds, Supabase Auth automatically sets the session
- The `onAuthStateChange` listener in AuthContext detects this
- It then calls `fetchUserProfile()` which returns null (no profile yet)
- Context state updates: `hasSession() = true`, `hasUser() = false`
- RootNavigator re-renders and shows AuthNavigator with Register screen
- User completes registration → profile is created → app navigates to driver dashboard

### Polling Mechanism
- Maximum 3 seconds of polling (30 attempts × 100ms)
- Checks for Supabase session with email ending in `@kushicabs.phone`
- If session appears within timeout, navigation happens automatically
- If timeout occurs, manually navigate with fallback (shouldn't happen in normal flow)
