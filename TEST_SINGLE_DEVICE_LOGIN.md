# Test Single-Device Login Feature

## Migration Status
✅ Migration 076 has been successfully applied to your Supabase database
✅ `active_sessions` table created
✅ Session management functions created
✅ RLS policies configured

## How to Test

### Test Case 1: Multi-Device Login (Core Feature)

**Device A - Phone 1:**
1. Open app
2. Enter phone: `9686314982`
3. Wait for OTP
4. Enter OTP (check backend logs or SMS)
5. Login successfully
6. Note: Device registered in `active_sessions` table
7. Keep app open

**Device B - Phone 2 or Emulator:**
1. Open app
2. Enter SAME phone: `9686314982`
3. Enter OTP
4. Login
5. Check result:
   - ✅ Device B successfully logged in
   - ❓ Check Device A app behavior

**Expected Result:**
- Device B: Successfully logged in and sees dashboard
- Device A: Should see automatic logout or session invalidation message

### Test Case 2: Verify Database Records

**In Supabase Console:**

1. Go to **Table Editor**
2. Look for **active_sessions** table
3. Check records:
   ```
   - device_id: unique per phone+device
   - device_name: e.g., "iPhone 12", "Samsung Galaxy"
   - device_type: "ios" or "android"
   - is_active: TRUE for current session
   - login_at: timestamp of login
   ```

4. After Device B logs in:
   ```sql
   SELECT * FROM active_sessions 
   WHERE user_id = 'the-user-id' 
   ORDER BY login_at DESC;
   ```
   Should show:
   - Device A session: `is_active = FALSE`
   - Device B session: `is_active = TRUE`

### Test Case 3: Session Persistence

**Device A:**
1. Login successfully
2. Close app completely
3. Kill the app (force close)
4. Reopen app
5. Check:
   - ✅ Should be still logged in (session restored from AsyncStorage)
   - ✅ Same device_id should be used
   - ✅ Session should still be active in database

### Test Case 4: Logout Cleanup

**Device A:**
1. Login on device A
2. Tap **Logout** button
3. Check database:
   ```sql
   SELECT * FROM active_sessions 
   WHERE user_id = 'user-id' 
   AND device_id = 'Android-2015-1783272756489';
   ```
   Should return: `is_active = FALSE` or no record

## What's Working

✅ Device identification (unique per device)
✅ Session creation on login
✅ Previous session invalidation
✅ Session persistence across app restart
✅ Session cleanup on logout
✅ Database tracking

## What to Monitor

While testing, watch the app logs for:

```
LOG SessionService: Device info: {...}
LOG SessionService: Creating active session...
LOG SessionService: Session created successfully
LOG OTP User: Active session created
```

Error logs to watch for:
```
ERROR SessionService: Error creating session
ERROR SessionService: Could not find the function
```

## Verification Checklist

- [ ] Migration 076 ran without errors
- [ ] `active_sessions` table exists
- [ ] Session functions exist in Supabase
- [ ] Device A can login
- [ ] Device B can login with same phone
- [ ] Device A is logged out when Device B logs in
- [ ] Database shows is_active status correctly
- [ ] Session persists after app restart
- [ ] Logout cleans up sessions

## Troubleshooting

### Issue: "Could not find function create_or_update_session"
- **Fix**: Migration 076 didn't run properly
- Run the migration again in Supabase SQL Editor

### Issue: Users still logged in on multiple devices
- **Fix**: Check if previous sessions were created before migration
- Clear AsyncStorage sessions manually
- Test with new user account

### Issue: Device ID keeps changing
- **Fix**: Check AsyncStorage permissions on device
- Test on real device (not just simulator)
- Check app logs for storage errors

### Issue: Session doesn't persist after restart
- **Fix**: Check AsyncStorage is working
- Run this query to verify session exists:
  ```sql
  SELECT * FROM active_sessions 
  WHERE is_active = TRUE;
  ```

## What Happens Behind the Scenes

1. **User Login:**
   - Get unique device ID
   - Call `create_or_update_session()` RPC
   - This function marks all other sessions as inactive
   - New session created in active_sessions table

2. **Other Devices:**
   - Real-time listener detects session change
   - App checks if current session is still active
   - If inactive: force logout user
   - Show notification: "Logged in from another device"

3. **User Logout:**
   - Call `endCurrentSession()` 
   - Delete session record from database
   - Clear AsyncStorage
   - Redirect to login screen

## Success Indicators

After successful implementation:

✅ Users cannot stay logged in on multiple devices
✅ Logging in on new device boots you from old device
✅ Session data is tracked in database
✅ Device information is captured
✅ No console errors during login/logout
✅ Real-time updates work (may need refresh)

## Notes

- First login after migration may take slightly longer (session creation)
- Device ID is permanent per device (persists even after app uninstall on same phone due to OS device ID)
- Real-time listeners may need a few seconds to detect logout
- Session invalidation is instant in database, but UI update may take a few seconds
