# Debug: Session Still Showing False

## Current Issue
After login, `hasSession()` returns false and user is being logged out.

## Root Cause Analysis

The session persistence has enhanced logging. Follow these steps to debug:

### Step 1: Check Browser Console
1. Open app in browser
2. **Open Dev Tools**: F12
3. **Go to Console tab**
4. Clear console
5. **Perform super admin login**
6. **Watch for these logs in order**:

```
LOG AuthProvider: initAuth starting...
LOG AuthProvider: Checking localStorage for superAdminSession: false  (first time)
LOG Super Admin: Setting session and user state
LOG Super Admin: Setting selected role: super_admin
LOG Super Admin: Session persisted to localStorage
LOG Super Admin: Verification - localStorage contains: true
LOG Super Admin session and user set - redirecting to dashboard
```

### Step 2: After Login - Check Session was Saved
In browser console, run:
```javascript
localStorage.getItem('superAdminSession')
```

Should return a JSON object like:
```javascript
{
  "user": {
    "id": "...",
    "email": "...",
    "phone": "..."
  },
  "access_token": "super-admin-verified",
  "token_type": "bearer"
}
```

### Step 3: Refresh Browser
1. **F5** to refresh
2. **Watch console for**:

```
LOG AuthProvider: initAuth starting...
LOG AuthProvider: Checking localStorage for superAdminSession: true  (found!)
LOG AuthProvider: Found super admin session in localStorage
LOG AuthProvider: Parsed session: {...}
LOG AuthProvider: Session set from localStorage, now fetching profile
LOG fetchUserProfile: Starting for user: [user-id]
LOG fetchUserProfile: Query result: {hasData: true, ...}
LOG fetchUserProfile: Setting user: [user-id] super_admin
LOG fetchUserProfile: Auto-selecting role: super_admin
LOG fetchUserProfile: Setting loading to false
LOG RootNavigator render: {hasSession: true, hasUser: true, userRole: "super_admin", ...}
```

### Step 4: Check if Navigation Works
- After refresh, should see **Settings tab** (not login screen)
- Should be able to navigate to **App Policies**

## If Session Still Shows False

### ✗ Symptom: hasSession = false after refresh

**Possible Cause 1: localStorage not persisting**
```javascript
// In console after login, check:
localStorage.getItem('superAdminSession')
// If null or empty → localStorage not working
```

**Fix**: Check browser localStorage is enabled:
- Chrome: Settings → Privacy → Cookies and other site data → Allow all
- Firefox: Privacy → Cookies → Allow websites to set cookies

**Possible Cause 2: fetchUserProfile failing**
- Look for error logs: `fetchUserProfile: Error fetching user profile:`
- If you see this, the user record might not exist in database
- Verify user was created correctly in database

**Possible Cause 3: Session being cleared by auth listener**
- Look for: `AuthProvider: Auth state change:`
- If this fires after login with empty session, auth listener is clearing it

**Fix for Cause 3**: The auth listener for Supabase needs fixing

### Debug Checklist

- [ ] After login, `localStorage.getItem('superAdminSession')` returns JSON
- [ ] After refresh, console shows "Found super admin session in localStorage"
- [ ] After refresh, `hasSession()` returns true
- [ ] Can see Settings tab after refresh
- [ ] Can click "App Policies" and it works
- [ ] No error logs in console

## Quick Tests

### Test 1: Verify localStorage Works
```javascript
// In browser console:
localStorage.setItem('test', 'hello');
localStorage.getItem('test');  // Should return 'hello'
localStorage.removeItem('test');
```

### Test 2: Manual Session Restore
```javascript
// Simulate what should happen on refresh:
const saved = localStorage.getItem('superAdminSession');
if (saved) {
  const session = JSON.parse(saved);
  console.log('Session would be restored:', session);
}
```

### Test 3: Check User in Database
In Supabase:
```sql
SELECT id, email, phone, role_id, is_active FROM users 
WHERE phone = '[your-phone-number]' AND role_id = 1;
```

Should return 1 row with the super admin user.

## Console Log Locations

If you see logs ending with "Super Admin session and user set..." but then hasSession is false:

1. **After splash screen disappears**, check what `RootNavigator render` shows
2. If it shows `hasSession: false`, the session was set but then cleared
3. Look for auth state change events that might be clearing it

## Solution If Still Not Working

1. **In AuthContext**, find the `onAuthStateChange` listener
2. Add this log at the top:
   ```javascript
   console.log('AuthProvider: Auth state change event:', event, !!session);
   ```
3. Check if Supabase auth listener is clearing the session after super admin login

---

**Use this debug guide to identify where the session is being lost!**
