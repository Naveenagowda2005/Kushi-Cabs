# Single-Device Login Implementation

## Overview
This implementation enforces that each user can only be logged in on one device at a time. When a user logs in from a new device, all previous sessions are automatically invalidated.

## Components Created

### 1. Database Migration (076_add_active_sessions_table.sql)
Creates the `active_sessions` table to track:
- User login sessions per device
- Device information (name, type, OS)
- Session activity timestamps
- Active/inactive status

**Key Tables:**
- `active_sessions` - Stores active sessions for each user

**Key Functions:**
- `create_or_update_session()` - Creates a new session and invalidates others
- `is_session_active()` - Checks if a specific session is still active
- `update_session_activity()` - Updates last activity timestamp
- `invalidate_other_sessions()` - Marks other sessions as inactive

**RLS Policies:**
- Users can only see their own sessions
- Super admin can view all sessions

### 2. Device Service (deviceService.js)
Provides device identification:
- Generates unique device ID on first app install
- Retrieves device information (name, OS, type)
- Persists device ID for consistency

**Key Functions:**
- `getDeviceId()` - Get or generate unique device identifier
- `getDeviceInfo()` - Get full device information
- `clearDeviceId()` - Reset device ID (for testing)

### 3. Session Service (sessionService.js)
Handles session management:
- Creates active sessions on login
- Checks if current session is still valid
- Updates session activity
- Ends sessions on logout
- Listens for real-time session invalidation

**Key Functions:**
- `createActiveSession()` - Create session and invalidate others
- `isSessionStillActive()` - Check if current device's session is valid
- `updateSessionActivity()` - Update last activity time
- `endCurrentSession()` - End session on logout
- `listenForSessionInvalidation()` - Real-time listener for logout

### 4. AuthContext Updates
Modified authentication context to:
- Call `createActiveSession()` after successful login
- Call `endCurrentSession()` on logout
- Support session invalidation detection

## How It Works

### Login Flow
1. User enters phone number and OTP
2. System verifies credentials
3. `createActiveSession()` is called:
   - Gets device ID for current device
   - Calls RPC function `create_or_update_session()`
   - This invalidates all other sessions for the user
   - Returns indication if other sessions were invalidated
4. User is logged in on current device
5. User is automatically logged out on any other devices

### Session Validation
- Each request checks if session is still active
- If session is invalidated (logged in elsewhere), user is logged out
- Real-time listeners notify app of invalidation

### Logout Flow
1. User clicks logout
2. `endCurrentSession()` is called to remove session record
3. User is signed out and redirected to login screen

## Database Schema

### active_sessions Table
```sql
- id (BIGINT PRIMARY KEY)
- user_id (UUID) - References users table
- device_id (TEXT) - Unique device identifier
- device_name (TEXT) - Device name (e.g., "iPhone 12")
- device_type (TEXT) - "ios" or "android"
- login_at (TIMESTAMP) - When user logged in
- last_activity_at (TIMESTAMP) - Last user activity
- is_active (BOOLEAN) - Whether session is still active
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## RLS Policies
- Users can view/update/delete their own sessions
- Super admin can view all sessions
- Automatic cleanup through CASCADE deletes

## Deployment Steps

1. Run migration 076 on Supabase:
```sql
-- Run the migration SQL file
```

2. Redeploy app with:
   - Updated AuthContext.js
   - New deviceService.js
   - New sessionService.js

3. Test:
   - Login on Device A
   - Login on Device B with same phone
   - Verify Device A is automatically logged out
   - Check `active_sessions` table

## Testing

### Test 1: Multiple Device Login
1. Login with phone "9686314982" on Device A
2. Note: Session created in database
3. Login with same phone on Device B
4. Verify:
   - Device A is logged out (receives logout event)
   - Only Device B session is active in database
   - Previous session marked as inactive

### Test 2: Session Persistence
1. Login on device
2. Kill and restart app
3. Verify user is still logged in (session restored from AsyncStorage)
4. Check database - session still marked as active

### Test 3: Manual Logout
1. Login on device
2. Tap logout button
3. Verify:
   - Session removed from database
   - User redirected to login screen

## Security Considerations

1. **Device ID Persistence**: Device ID is stored locally and persists across app sessions. This ensures the same device is always recognized.

2. **Session Invalidation**: When a user logs in from a new device, all previous sessions are immediately invalidated. This prevents concurrent logins.

3. **RLS Protection**: Database policies ensure users can only access their own sessions and super admin has full visibility.

4. **Real-time Detection**: Real-time listeners on the Supabase channel notify the app when the session is invalidated, triggering immediate logout.

## Troubleshooting

### User Can Still Login on Multiple Devices
- Check if migration 076 was applied to database
- Verify `active_sessions` table exists
- Check RLS policies are correct
- Review server logs for session creation errors

### Session Invalidation Not Working
- Verify Supabase real-time is enabled
- Check network connectivity
- Review browser console for listener errors

### Device ID Not Persisting
- Check AsyncStorage permissions
- Verify `DEVICE_ID_KEY` key is not cleared
- Test on real device (not simulator)

## Future Enhancements

1. **Session Management UI**: Allow users to view and manage their active sessions
2. **Geolocation**: Track login locations for security
3. **Device Fingerprinting**: More robust device identification
4. **Session Timeout**: Auto-logout after inactivity period
5. **Push Notifications**: Notify users when logged in from new device

## Performance Notes

- Session lookups are indexed by user_id and device_id for fast retrieval
- Real-time listeners use Supabase Postgres_Changes for efficiency
- No polling required - uses WebSocket for real-time updates
