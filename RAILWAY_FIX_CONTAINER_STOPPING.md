# Fix Railway Container Stopping Issue

## The Problem
Container starts, then immediately stops. Cause: Railway health checks failing or missing environment variables.

## Solution: Set Environment Variables in Railway

### Step 1: Go to Railway Dashboard
https://railway.app → Click "Kushi-Cabs" project

### Step 2: Click Backend Service

### Step 3: Go to "Variables" Tab

### Step 4: Add These Variables
Copy and paste these exactly:

```
SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I
STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
STPL_API_KEY=26568C0BBD2CEC
STPL_SENDER_ID=KUSCAB
STPL_ROUTE=TransAPI
STPL_ROUTE_ID=13
STPL_CAMPAIGN=0
STPL_COUNTRY_CODE=91
OTP_TTL_SECONDS=300
STPL_OTP_TEMPLATE_ID=1707177980314073534
```

### Step 5: Save & Trigger Redeploy

After adding variables, Railway will auto-redeploy. Wait 3-5 minutes.

### Step 6: Check Console Logs
Click "Console" tab and look for:
```
✅ Taxi SMS backend listening on...
```

If you see this WITHOUT "Stopping Container" after it, the issue is fixed!

### Step 7: Test
```bash
curl https://kushi-cabs-production.up.railway.app/health
```

Should return:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"..."}
```

---

## If Still Stopping

### Check Deploy Logs
1. Click "Deployments" tab
2. Click the latest deployment
3. Look for ERROR messages

### Common Issues:
- `MODULE NOT FOUND` → npm install failed
- `EADDRINUSE` → Port 8080 already in use
- `TIMEOUT` → Service taking too long to start

---

## Quick Checklist

- [ ] Variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STPL_*)
- [ ] Deployment shows "Running" (green checkmark)
- [ ] Console shows `✅ Taxi SMS backend listening`
- [ ] No "Stopping Container" message after startup
- [ ] Health endpoint responds: `curl https://kushi-cabs-production.up.railway.app/health`

Once all pass ✅, your backend is ready for production!
