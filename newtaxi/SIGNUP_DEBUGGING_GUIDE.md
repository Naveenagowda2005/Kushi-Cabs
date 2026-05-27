# Signup Navigation Debugging Guide

## Current Issue
Users can create accounts successfully, but the app doesn't automatically redirect to the main app after signup. Users have to manually sign in again.

## Debugging Steps

### 1. Test Database Connection
- Open the vendor app
- Go to signup screen
- Click "Test Connection" button
- Should show: "Found 3 roles: admin, vendor, driver"

### 2. Check Auth State After Signup
- Fill out signup form with valid details
- Click "Create Account"
- After account creation, click "Check Auth State" button
- This will show current session and user status

### 3. Expected Behavior vs Actual

#### **Expected:**
1. User fills signup form
2. Account created in Supabase
3. User profile created in database
4. Welcome message shown
5. User clicks "Continue"
6. App redirects to main enquiries screen

#### **Actual:**
1. User fills signup form ✅
2. Account created in Supabase ✅
3. User profile created in database ✅
4. Welcome message shown ✅
5. User clicks "Continue" ✅
6. ❌ **App stays on signup screen**

## Possible Causes

### 1. **Email Confirmation Required**
- Supabase might be configured to require email confirmation
- This means no session is created until email is verified
- **Solution**: Disable email confirmation in Supabase dashboard

### 2. **Auth State Not Propagating**
- Session exists but AuthContext doesn't detect user profile
- Database query might be failing
- **Solution**: Check database permissions and RLS policies

### 3. **Timing Issues**
- Database changes haven't propagated when profile refresh happens
- **Solution**: Add longer delays or retry logic

### 4. **RLS Policy Issues**
- Row Level Security might be blocking user profile queries
- **Solution**: Check RLS policies for users table

## Quick Fixes to Try

### Fix 1: Disable Email Confirmation
1. Go to Supabase Dashboard
2. Navigate to Authentication > Settings
3. Disable "Enable email confirmations"
4. Test signup again

### Fix 2: Check RLS Policies
Run this in Supabase SQL Editor:
```sql
-- Check if RLS is enabled and what policies exist
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'vendors', 'roles');

-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename IN ('users', 'vendors', 'roles');
```

### Fix 3: Manual Session Refresh
If the automatic approach fails, we can force a session refresh:

```javascript
// In SignUpScreen after account creation
const { data: sessionData } = await supabase.auth.getSession();
if (sessionData.session) {
  // Force auth state change
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // This should trigger navigation
    }
  });
}
```

## Debug Console Logs

When testing signup, check the console for these logs:

1. `"Starting signup process with helper..."`
2. `"Auth user created: [user-id]"`
3. `"Vendor profiles created successfully"`
4. `"Signup result: { success: true, ... }"`
5. `"User clicked Continue, refreshing profile..."`
6. `"refreshUserProfile called"`
7. `"Current session check: { hasSession: true, ... }"`
8. `"fetchUserProfile called for user: [user-id]"`
9. `"User profile query result: { data: {...}, error: null }"`
10. `"Setting user profile: {...}"`
11. `"RootNavigator render: { hasSession: true, hasUser: true, ... }"`
12. `"Navigation decision: { shouldShowApp: true }"`

## Testing Checklist

- [ ] Database connection works (Test Connection button)
- [ ] Roles table has vendor role
- [ ] User account created in auth.users
- [ ] User profile created in users table
- [ ] Vendor profile created in vendors table
- [ ] Session exists after signup
- [ ] User profile query returns data
- [ ] AuthContext sets user state
- [ ] RootNavigator receives both session and user
- [ ] Navigation switches to AppNavigator

## Fallback Solutions

If automatic navigation still doesn't work:

### Option 1: Force Navigation
```javascript
// After successful signup
navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }],
});
// Then auto-login
```

### Option 2: Skip Welcome Message
```javascript
// Immediately after account creation
if (result.success && !result.needsConfirmation) {
  await refreshUserProfile();
  // Skip alert, let AuthContext handle navigation
}
```

### Option 3: Use Different Navigation Pattern
```javascript
// Use navigation listener
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Check if user should be redirected
    checkAndRedirectUser();
  });
  return unsubscribe;
}, [navigation]);
```

## Next Steps

1. **Test the debug buttons** to see current state
2. **Check Supabase dashboard** for email confirmation settings
3. **Review console logs** during signup process
4. **Verify RLS policies** are not blocking queries
5. **Try the fallback solutions** if needed

The issue is likely one of these common problems, and the debug tools will help identify which one.