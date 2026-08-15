# URGENT: Run Migration 076 Now

The app is trying to use session management functions that don't exist in the database yet.

## Quick Fix (2 minutes)

1. Open Supabase Console: https://app.supabase.com
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire content from:
   ```
   c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\supabase\migrations\076_add_active_sessions_table.sql
   ```
5. Click **Run** button
6. Wait for success message
7. Reload the app

## What This Does

Creates:
- `active_sessions` table - tracks user logins per device
- `create_or_update_session()` function - creates sessions and invalidates others
- `is_session_active()` function - checks if session is valid
- `update_session_activity()` function - updates activity timestamp
- `invalidate_other_sessions()` function - logs out other devices
- RLS policies - security for session data

## After Running

The error should disappear and:
1. Users can only login on ONE device
2. Login on new device = auto-logout from old device
3. Session data tracks all logins

## Verification

After running the migration, check in Supabase:
1. Go to **Table Editor**
2. Should see new table: `active_sessions`
3. Go to **Databases** → **Functions**
4. Should see new functions starting with session names

Then reload the app - it should work!
