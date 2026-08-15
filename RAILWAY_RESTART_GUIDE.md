# Railway Service Restart & Redeploy

## The Issue
- Domain exists: `kushi-cabs-production.up.railway.app:8080`
- But DNS doesn't resolve = Service might not be running
- Backend code is deployed but may have crashed

## Quick Fix: Restart Service

### Step 1: In Railway Dashboard
1. Go to https://railway.app
2. Click on "Kushi-Cabs" project
3. Click on the backend service (you should see it listed)
4. Click the **"..." (three dots)** menu
5. Select **"Restart"**
6. Wait 2-3 minutes for restart

### Step 2: Check Deployment Logs
1. Click "Deployments" tab
2. Look for recent deployment
3. Check if it shows "Running" or "Failed"
4. If "Failed", check error logs

### Step 3: Check Deploy Logs
1. Click "Deploy Logs"
2. Look for errors starting with "ERROR" or "FAIL"
3. Share any errors you see

### Step 4: Test Again
```bash
curl https://kushi-cabs-production.up.railway.app/health
```

---

## If Still Not Working: Redeploy

### Option A: Redeploy via GitHub (Automatic)
1. In Railway, click backend service
2. Click "..." menu
3. Select "Redeploy"
4. Wait 5-10 minutes
5. Test again

### Option B: Manual Redeploy
```bash
cd backend
git add .
git commit -m "Redeploy backend"
git push origin master
```

Railway will auto-redeploy on push.

---

## If Still Failing: Emergency Workaround

Use ngrok (temporary):
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Expose with ngrok
ngrok http 8080
```

Copy ngrok URL and update `.env`:
```
EXPO_PUBLIC_SMS_API_URL=https://[ngrok-url]
```

---

## What to do RIGHT NOW:

1. Go to Railway dashboard
2. Click backend service
3. Click "..." menu
4. Select "Restart"
5. Wait 3 minutes
6. Try again: `curl https://kushi-cabs-production.up.railway.app/health`

Let me know if it works!
