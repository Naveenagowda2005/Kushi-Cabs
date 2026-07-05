# Deployment Guide: Single Device Login

## Quick Setup (5 minutes)

### Step 1: Apply Database Migration
1. Open Supabase Console
2. Go to SQL Editor
3. Create new query and paste content from:
   `newtaxi/supabase/migrations/076_add_active_sessions_table.sql`
4. Run the query
5. Verify success - you should see:
   - Table `active_sessions` created
   - Functions created: `create_or_update_session`, `is_session_active`, `update_session_activity`, `invalidate_other_sessions`
   - RLS policies enabled

### Step 2: Verify Files Are in Place
Check that these files exist:
```
newtaxi/apps/unified/src/services/deviceService.js
newtaxi/apps/unified/src/services/sessionService.js
newtaxi/apps/unified/src/context/AuthContext.js (updated)
```

### Step 3: Update Dependencies
No new dependencies needed! Uses existing:
- `expo-device` (for device info)
- `@react-native-async-storage/async-storage` (for device ID storage)

### Step 4: Rebuild and Test App
```bash
cd newtaxi/apps/unified
npm install  # Install any missing dependencies
expo prebuild --clean
expo start
```

### Step 5: Test the Implementation

**Test Case 1: Login from Two Devices**
1. Open app on Device A (Phone 1)
2. Login with test phone: 9686314982
3. Note the successful login
4. Go to Supabase Console → SQL Editor
5. Run this query to verify session:
```sql
SELECT * FROM active_sessions WHERE user_id = 'user-id-here';
```
6. Should show 1 active session for Device A
7. Open app on Device B (Phone 2 or Simulator)
8. Login with SAME phone: 9686314982
9. Check Supabase again - should see:
   - Device A session: `is_active = FALSE`
   - Device B session: `is_active = TRUE`
10. Device A app should show logout screen or be automatically logged out

**Test Case 2: Verify Session Tracking**
```sql
-- Check all active sessions
SELECT id, user_id, device_id, device_name, is_active, login_at 
FROM active_sessions 
ORDER BY login_at DESC;

-- Check a specific user's session history
SELECT * FROM active_sessions 
WHERE user_id = 'user-id-here' 
ORDER BY login_at DESC;
```

## What Was Changed

### New Files
1. `src/services/deviceService.js` - Device identification
2. `src/services/sessionService.js` - Session management

### Modified Files
1. `src/context/AuthContext.js`:
   - Added imports for session services
   - Updated `signIn()` to call `createActiveSession()`
   - Updated `signOut()` to call `endCurrentSession()`

### Database
1. New table: `active_sessions`
2. New functions: `create_or_update_session()`, `is_session_active()`, `update_session_activity()`, `invalidate_other_sessions()`
3. New RLS policies for session access control

## How to Verify It's Working

### Check 1: Database Table Created
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'active_sessions';
```

### Check 2: RLS Policies Exist
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'active_sessions';
```
Should show:
- users_view_own_sessions
- users_update_own_sessions
- users_delete_own_sessions
- users_insert_own_sessions
- superadmin_view_all_sessions

### Check 3: Functions Exist
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_schema = 'public' 
AND routine_name LIKE 'create_or_update_session%' 
  OR routine_name LIKE 'is_session_active%';
```

### Check 4: Live Testing
1. Open mobile app
2. Login
3. Open browser → Supabase Console
4. Check `active_sessions` table
5. Should have new record with your device info

### Check 5: Session Invalidation
1. Login on Device A
2. Note session ID from database
3. Login on Device B with same credentials
4. Check Device A - should be logged out
5. Database should show Device A session as `is_active = FALSE`

## Rollback Plan (If Issues Occur)

If you need to revert:

```sql
-- Drop the new table and functions
DROP TABLE IF EXISTS public.active_sessions CASCADE;
DROP FUNCTION IF EXISTS public.create_or_update_session CASCADE;
DROP FUNCTION IF EXISTS public.is_session_active CASCADE;
DROP FUNCTION IF EXISTS public.update_session_activity CASCADE;
DROP FUNCTION IF EXISTS public.invalidate_other_sessions CASCADE;
```

Then revert `AuthContext.js` changes:
- Remove session service imports
- Remove `createActiveSession()` call from `signIn()`
- Remove `endCurrentSession()` call from `signOut()`

## Troubleshooting

### Issue: "Function does not exist" error
- **Cause**: Migration not applied
- **Fix**: Run migration 076 SQL again, verify no errors

### Issue: Permission denied on active_sessions table
- **Cause**: RLS policies not applied correctly
- **Fix**: Check policies exist, verify `auth.uid()` function works

### Issue: Session not creating for some users
- **Cause**: User doesn't have proper permissions
- **Fix**: Check RLS policies, ensure user is authenticated

### Issue: Users staying logged in after new device login
- **Cause**: Real-time listener not working
- **Fix**: Check Supabase real-time is enabled, check network connectivity

## Success Indicators

✅ After successful deployment:
1. Users cannot be logged in on multiple devices
2. When logging in on new device, old device is automatically logged out
3. Session records appear in `active_sessions` table
4. Device information is accurately captured
5. No console errors during login/logout

## Support

For issues:
1. Check Supabase logs for errors
2. Review browser console for JavaScript errors
3. Verify migration SQL ran without errors
4. Test with fresh user account
5. Check network connectivity to Supabase

## Next Steps

After successful deployment:
1. Inform users that only one device login is now allowed
2. Monitor `active_sessions` table for usage patterns
3. Consider adding session management UI for users to view active sessions
4. Plan for future enhancements (geolocation tracking, session timeout, etc.)
