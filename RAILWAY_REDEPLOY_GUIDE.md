# Railway Redeployment Guide - Backend Fix

## Problem
The Railway backend was crashing (502 error) because environment variables weren't being picked up at startup.

## Solution Applied
✅ Added `PORT=4000` to Railway Variables  
✅ Fixed backend code to not crash on missing env vars at startup  
✅ Added validation when actually sending SMS

## What You Need to Do Now

### Option 1: Manual Redeployment (RECOMMENDED - Fastest)
1. Go to https://railway.app/project/[your-project-id]
2. Click on the **Kushi-Cabs backend** service
3. Go to **Deployments** tab
4. Click the **3-dot menu** on the latest deployment
5. Select **Redeploy** (or **Rerun**)
6. Wait 2-3 minutes for the new deployment to start

### Option 2: Trigger via Git Push
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI
git commit --allow-empty -m "Trigger Railway redeployment"
git push origin master
```
This will automatically trigger a new build and deployment.

## Verification After Redeployment

### Test 1: Health Check
```bash
curl https://kushi-cabs-production.up.railway.app/health
```
Should return:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"..."}
```

### Test 2: Try OTP in App
1. Install the latest APK
2. Go to Login/Sign Up
3. Enter phone number and request OTP
4. Should receive OTP via SMS (or see success message)

## Important Environment Variables Verified in Railway

| Variable | Status | Value |
|----------|--------|-------|
| PORT | ✅ Set | 4000 |
| STPL_API_KEY | ✅ Set | (hidden) |
| STPL_SENDER_ID | ✅ Set | KUSCAB |
| STPL_API_URL | ✅ Set | https://sms.hitechsms.com/app/smsapi/index.php |
| OTP_TTL_SECONDS | ✅ Set | 300 |
| SUPABASE_URL | ✅ Set | https://vofupwsnbcidjnifaihm.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Set | (hidden) |

## If Still Getting 502 Error After Redeployment

Check Railway console logs:
1. Click **Kushi-Cabs** service in Railway
2. Click **Console** tab
3. Look for error messages
4. Common issues:
   - Missing STPL_API_KEY
   - SMS service API is down
   - Port binding issues

## Timeline
- Code fix committed: ✅
- Code pushed: ✅
- PORT variable added to Railway: ✅
- **Next: Trigger redeployment** ← YOU ARE HERE

Once redeployed, OTP login should work!
