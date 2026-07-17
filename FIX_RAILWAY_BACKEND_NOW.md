# Fix Railway Backend - Step by Step

## Status
- ✅ Backend code deployed to Railway
- ❌ Service not responding
- 🔄 Just updated Procfile and redeployed

## What to do RIGHT NOW

### Step 1: Go to Railway Dashboard
https://railway.app → Click "Kushi-Cabs" project

### Step 2: Check Deploy Status
1. Click the backend service
2. Go to "Deployments" tab
3. Look for the **latest deployment**
4. Wait for it to complete (should show green checkmark)

### Step 3: Check Logs
1. Click "Deploy Logs" tab
2. Look for any ERROR messages
3. If you see errors, share them with me

### Step 4: Check HTTP Logs
1. Click "HTTP Logs" tab
2. Try to access the health endpoint from browser
3. You should see logs appear here

### Step 5: Test the URL
Once deployment shows as "Running":
```bash
curl https://kushi-cabs-production.up.railway.app/health
```

If it works, you should see:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"..."}
```

---

## If Still Not Working

### Option A: Check Environment Variables
1. Click "Variables" tab
2. Make sure these are set:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - STPL_API_KEY (for SMS)

If missing, add them.

### Option B: Restart Service
1. Click the "..." menu on the service
2. Select "Restart"
3. Wait 2 minutes
4. Test again

### Option C: Check Console Logs
1. Click "Console" tab
2. Look for error messages
3. Should show: "✅ Taxi SMS backend listening on..."

---

## What Changed?

I fixed two things:
1. **Procfile** - Changed from `npm install && node index.js` to just `node index.js`
   - `npm install` runs during build, not runtime
   - This was causing the service to crash on startup

2. **Reverted to production URL** - App now uses `https://kushi-cabs-production.up.railway.app`

---

## Timeline

- ✅ Code pushed to GitHub (just now)
- 🔄 Railway auto-detecting changes and redeploying
- ⏱️ Should be running in 2-5 minutes

---

## Next Steps

1. **Wait 3-5 minutes** for Railway to redeploy
2. **Check the logs** (Console tab)
3. **Test the health endpoint** again
4. If it works, you're ready for production!

If it still doesn't work after 5 minutes, check "Deploy Logs" for error messages and share them.
