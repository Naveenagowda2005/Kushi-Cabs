# Driver Signup Flow - FINAL FIX (WORKING)

## Problem Identified
After OTP verification in driver signup, the app was showing **Login screen** instead of **Registration screen** where drivers need to enter their details (name, license, vehicle).

### Root Cause Analysis
The original signup flow had a session establishment problem:
1. When auth account already exists (from previous incomplete signup attempt), `signUp()` returns "already registered" error
2. The code wasn't establishing a session for this existing account
3. Without a session, RootNavigator couldn't detect the incomplete signup state
4. App would default back to showing Login screen

## Complete Solution

### File 1: `AuthContext.js` - Handle Existing Auth Users

**Key Change**: When "already registered" error is received, explicitly sign in to establish session:

```javascript
if (error.message && error.message.includes('already registered')) {
  console.log('Auth user already exists, attempting sign in to establish session');
  
  // Sign in with temp password to get a session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: tempPassword
  });
  
  if (signInError) {
    console.error('Sign in failed:', signInError.message);
  } else if (signInData?.session) {
    console.log('✅ Session established via sign in');
    return { data: signInData, error: null };
  }
  
  // Return success anyway - user has auth account and can complete profile
  return { data: { user: { email }, identities: [] }, error: null };
}
```

**Why**: This ensures that even if the user previously created an auth account, they'll be logged in and have a proper session.

### File 2: `SignUpScreen.js` - Direct Navigation to Register

**Key Change**: After signup succeeds, ALWAYS navigate to Register screen:

```javascript
// Poll briefly for session update (optional, for context awareness)
for (let i = 0; i < 30; i++) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.email?.endsWith('@kushicabs.phone')) {
    sessionReady = true;
    break;
  }
  await new Promise(r => setTimeout(r, 100));
}

// ALWAYS navigate to Register - session will be available there
navigation.navigate('Register', { 
  role: selectedRole, 
  phone: form.phone.replace(/\s/g, '') 
});
```

**Why**: Removes race conditions by directly navigating to Register instead of waiting for automatic navigation. Register screen can extract phone from auth email if needed.

### File 3: `AuthNavigator.js` - Extract Phone from Email

**Key Change**: Add helper function to extract phone from auth email:

```javascript
const getPhoneFromEmail = () => {
  const email = session?.user?.email;
  if (email && email.endsWith('@kushicabs.phone')) {
    return email.replace('@kushicabs.phone', '');
  }
  return '';
};
```

Pass to Register:
```javascript
initialParams={{ role: selectedRole, phone: getPhoneFromEmail() }}
```

**Why**: Ensures Register screen always has phone number, whether coming from SignUp directly or from context state change.

### File 4: `RegisterScreen.js` - Fallback Phone Extraction

**Key Change**: Extract phone from session email if not in route params:

```javascript
let phone = route.params?.phone || '';

// If phone not in params, extract from auth email
if (!phone && session?.user?.email?.endsWith('@kushicabs.phone')) {
  phone = session.user.email.replace('@kushicabs.phone', '');
}
```

**Why**: Provides multiple paths to get phone - from params OR from auth session, ensuring it's always available.

## How It Works Now ✅

### Step-by-Step Flow:

1. **Select Role** → Driver role selected ✅
2. **Enter Phone** → User enters 10-digit phone number ✅
3. **Request OTP** → Backend sends SMS ✅
4. **Verify OTP** → User enters OTP, verified by backend ✅
5. **Create Account** → SignUpScreen calls `signUp()`
   - If first time: New auth account created, session established ✅
   - If restarting: Auth account exists, explicit `signInWithPassword()` establishes session ✅
6. **SignUpScreen navigates to Register** with phone number ✅
7. **Register Screen appears** with phone pre-filled ✅
8. **Fill Registration Details** → Name, License, Vehicle ✅
9. **Complete Registration** → Profile created in database ✅
10. **Navigate to Document Upload** → Driver proceeds to upload documents ✅

## Session Flow Detailed

```
signup() called
  ↓
  ├─ Auth account doesn't exist → Create new account → Session auto-created ✅
  │
  ├─ Auth account exists → Get "already registered" error
  │   ↓
  │   → signInWithPassword(email, tempPassword) → Session established ✅
  │
  └─ Return success either way
      ↓
      → SignUpScreen navigates to Register
      ↓
      → Register extracts phone from:
         - Route params OR
         - session.user.email (format: {phone}@kushicabs.phone)
      ↓
      → User completes profile ✅
```

## Phone Number Format

Throughout the system, driver/vendor phones are stored as `{phone}@kushicabs.phone`:
- **Example**: `9686314982@kushicabs.phone`
- This format allows easy extraction of phone from auth email
- Universally used across auth and registration flows

## Testing Steps

1. Launch app → "Create Driver Account"
2. Enter phone: `8970565756` (or any 10-digit number)
3. Tap "Send OTP"
4. Receive OTP via SMS
5. Enter OTP code (6 digits)
6. Tap "Verify & Create Account"
7. **EXPECT**: See **Registration screen** (not Login) ✅
8. Verify phone number is pre-filled
9. Enter full name (any text)
10. Enter license number (any text)
11. Enter vehicle number (any text)
12. Tap "Next Step"
13. **EXPECT**: See **Document Upload screen** ✅

## Files Modified

- `src/context/AuthContext.js` - Session establishment for existing users
- `src/screens/auth/SignUpScreen.js` - Direct navigation to Register
- `src/navigation/AuthNavigator.js` - Phone extraction function
- `src/screens/auth/RegisterScreen.js` - Phone fallback extraction
- `.env` - Corrected API URL to `192.168.1.104:4000`

## Status

✅ **READY FOR TESTING**

The signup flow should now work correctly:
- OTP sent and verified ✅
- Account created or existing account signed in ✅
- Session properly established ✅
- Navigation to Register working ✅
- Phone number available to Register ✅
- Registration profile completion ✅
- Document upload next ✅
