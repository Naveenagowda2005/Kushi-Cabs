# Backend Deployment - Critical Issue & Solutions

## Problem
The production URL `https://kushi-cabs-production.up.railway.app` is not responding. The backend is NOT deployed to Railway.

## Root Cause
The backend was never pushed/deployed to Railway. The AAB build is expecting this URL but it's not accessible.

---

## SOLUTION A: Deploy to Railway (Recommended - Production)

### Step 1: Install Railway CLI
```bash
npm install -g railway
```

### Step 2: Navigate to Backend
```bash
cd backend
```

### Step 3: Login
```bash
railway login
```

### Step 4: Create Railway Project
```bash
railway init
```
When prompted:
- Project name: `taxi-sms-backend`
- Environment: Node.js

### Step 5: Set Environment Variables
Go to Railway Dashboard (https://railway.app) and add these variables to your project:

```
STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
STPL_API_KEY=26568C0BBD2CEC
STPL_SENDER_ID=KUSCAB
STPL_ROUTE=TransAPI
STPL_ROUTE_ID=13
STPL_CAMPAIGN=0
STPL_COUNTRY_CODE=91
OTP_TTL_SECONDS=300
STPL_OTP_TEMPLATE_ID=1707177980314073534
SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I
```

### Step 6: Deploy
```bash
railway up
```

### Step 7: Get Production URL
After deployment completes, Railway will show you a URL. It should be:
```
https://kushi-cabs-production.up.railway.app
```

### Step 8: Test
```bash
curl https://kushi-cabs-production.up.railway.app/health
```

Expected response:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"..."}
```

---

## SOLUTION B: Use Local Backend During Testing (Quick Fix)

### If Railway deployment is taking time, use local backend:

#### Option B1: Update App .env (For Testing Only)
Change in `newtaxi/apps/unified/.env`:
```
EXPO_PUBLIC_SMS_API_URL=http://192.168.1.110:8080
```

Then rebuild AAB:
```bash
cd newtaxi/apps/unified
eas build --platform android --build-profile production
```

⚠️ NOTE: This won't work for production since phones won't have access to your local network IP.

#### Option B2: Use ngrok Tunnel (Testing)
Expose local backend to internet:

1. Install ngrok: https://ngrok.com/download
2. Run ngrok:
```bash
ngrok http 8080
```
3. This gives you a public URL like: `https://abc123.ngrok.io`
4. Update `.env`:
```
EXPO_PUBLIC_SMS_API_URL=https://abc123.ngrok.io
```
5. Rebuild AAB

⚠️ NOTE: This URL is temporary (free tier expires in a few hours). Not suitable for production.

---

## SOLUTION C: Alternative Cloud Hosting

### Render.com (Easy alternative to Railway)
1. Go to https://render.com
2. Create account and new Web Service
3. Select your GitHub repo
4. Set build command: `cd backend && npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

### Heroku (Legacy but still works)
1. `npm install -g heroku`
2. `heroku login`
3. `heroku create taxi-sms-backend`
4. Add environment variables: `heroku config:set STPL_API_KEY=...`
5. Deploy: `git push heroku main`

---

## RECOMMENDED ACTION RIGHT NOW

Since you already have an AAB built expecting the Railway URL, I recommend:

1. **Deploy to Railway** (Solution A) - Takes 5-10 minutes
2. **Test with phone** - Should now work
3. **If Railway gives you a different URL**, rebuild AAB with the correct URL

---

## Check Current Status

### View all Railway projects:
```bash
railway list
```

### View logs if already deployed:
```bash
railway logs
```

### Check domain:
```bash
railway domains
```

---

## Immediate Next Steps

Choose ONE:
1. **I'll deploy to Railway right now** → Follow Solution A steps above
2. **I want to use local backend for testing** → Use Solution B
3. **I have Railway already set up but it's not working** → Run `railway logs` and share output

Which would you prefer?
