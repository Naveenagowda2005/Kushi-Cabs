# Fresh Start - Quick Fix Guide

## Problem
App is showing "Register" screen and trying to restore an old session from your previous Supabase account. This happens because the app still has old session data in AsyncStorage.

## Quick Solution - 3 Steps

### Step 1: Clear Storage from the App
When you see the role selection screen on startup:
1. Look for the red button at the bottom: **"🗑️  Clear Storage for Fresh Start"**
2. Tap it
3. Confirm when prompted
4. The app will clear all old session data

### Step 2: Restart the App
After clearing:
1. Close the Expo app completely
2. Reopen it or press `r` in the terminal to reload

### Step 3: Start Fresh Registration
You should now see:
- Clean role selection screen (no old session)
- No "Restore session" attempts
- Ready for fresh registration

---

## What Gets Cleared
- ❌ Old OTP user sessions
- ❌ Old super admin sessions
- ❌ Cached user profiles
- ❌ Auth tokens from old account
- ❌ All app storage

## What Stays
- ✅ App code and configuration
- ✅ Your .env file (Supabase credentials)
- ✅ Your new Supabase database

---

## After Clearing - Next Steps

### 1. Try Role Selection
- Choose **Driver**, **Vendor**, or **Super Admin**
- No old data will interfere

### 2. Fresh Registration
- Use new phone numbers
- No conflicts with old accounts
- Clean verification process

### 3. Backend SMS (if needed)
- Verify SMS backend is running: `npm run dev` in `backend/`
- Check `.env` URLs are correct

---

## If Still Having Issues

### Problem: "User not found" after clearing
**Solution:** Restart the app completely (force close Expo)

### Problem: Button doesn't appear
**Solution:** Check you're on the role selection screen (first screen after splash)

### Problem: Error when clearing
**Solution:** Try this manual command in a terminal:
```bash
adb shell am start -n com.your.app/.MainActivity -a android.intent.action.VIEW
```

---

## Debug Info
To check what's in storage (for debugging):
1. Open your terminal where Expo is running
2. Press `j` to open debugger
3. Console will show stored data

---

**Need help?** Check these files:
- Cleanup utility: `src/utils/clearStorageForFreshStart.js`
- Button location: `src/screens/auth/RoleSelectionScreen.js`
- Fresh start guide: `FRESH_START_SETUP_GUIDE.md`
