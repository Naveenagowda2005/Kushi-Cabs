# SMS Backend Connection Troubleshooting

## Current Status
- ✅ Backend is deployed on Railway
- ✅ Railway shows service as "Active"
- ❌ App shows "Unable to connect to SMS service"

## Root Causes

### 1. DNS Not Propagated Yet (Most Likely)
Railway's DNS (`kushi-cabs-production.up.railway.app`) may take 5-30 minutes to fully propagate.

**Quick Test:**
```bash
nslookup kushi-cabs-production.up.railway.app
```

If it can't resolve the domain, DNS hasn't propagated. **Wait 10-15 minutes and try again.**

### 2. Railway Backend Not Responding
Even though it shows "Active", the service might have crashed.

**How to Check:**
1. Go to https://railway.app
2. Open your Kushi-Cabs project
3. Click on the backend service
4. Check "Deploy Logs" for errors
5. Check "HTTP Logs" to see if it's receiving requests

### 3. Wrong URL Format
The app might be using a slightly different URL format.

**Current URL:** `https://kushi-cabs-production.up.railway.app`

Check if Railway dashboard shows a different URL under "Deployments" or "Domains"

---

## Solution Steps

### Step 1: Verify DNS Resolution (Do This First)
On your computer:
```bash
nslookup kushi-cabs-production.up.railway.app
```

Expected: Should show an IP address  
If: "Non-existent domain" → DNS not ready yet, wait 15 min

### Step 2: Test Backend Health Endpoint
```bash
curl https://kushi-cabs-production.up.railway.app/health
```

Expected response:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"2026-07-15T..."}
```

If this works from your computer but not from phone: **Firewall/Network issue**

### Step 3: Restart Railway Service
1. Go to Railway dashboard
2. Click your backend service
3. Click "..." menu
4. Select "Restart"
5. Wait 2-3 minutes for restart

### Step 4: Check Environment Variables
1. Go to Railway service
2. Click "Variables"
3. Verify all these are set:
   - STPL_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - Others...

### Step 5: Check Railway Logs
1. Click "Deploy Logs" - Look for errors during startup
2. Click "HTTP Logs" - Check if requests are reaching the backend

---

## If Railway DNS is Still Not Working

### Quick Workaround: Use ngrok

1. Install ngrok: https://ngrok.com/download
2. Make sure backend is running locally:
   ```bash
   cd backend
   npm start
   ```
3. In another terminal, run ngrok:
   ```bash
   ngrok http 8080
   ```
4. Copy the HTTPS URL (e.g., `https://abc123-xyz.ngrok.io`)
5. Update `.env`:
   ```
   EXPO_PUBLIC_SMS_API_URL=https://abc123-xyz.ngrok.io
   ```
6. Rebuild AAB:
   ```bash
   cd newtaxi/apps/unified
   eas build --platform android --build-profile production
   ```

---

## Debug Commands

### From your computer:
```bash
# Test connection
curl https://kushi-cabs-production.up.railway.app/health -v

# Test OTP endpoint
curl -X POST https://kushi-cabs-production.up.railway.app/sms/otp \
  -H "Content-Type: application/json" \
  -d '{"to":"919686314982"}'

# Check DNS
nslookup kushi-cabs-production.up.railway.app
dig kushi-cabs-production.up.railway.app

# Check connection
ping kushi-cabs-production.up.railway.app
```

### From Railway Dashboard:
1. **Deploy Logs**: Shows if service started successfully
2. **HTTP Logs**: Shows all incoming requests
3. **Monitoring**: Shows CPU, memory, uptime

---

## Most Likely Scenario

**99% chance:** DNS hasn't fully propagated yet

**Action:** 
1. Wait 10-15 minutes
2. Try again
3. If still fails after 30 minutes → Check Railway logs or use ngrok workaround

---

## Next Step

**Do one of these:**

1. **Wait & Retry**
   - Wait 15 minutes
   - Uninstall app from phone
   - Rebuild AAB: `eas build --platform android --build-profile production`
   - Install and test

2. **Test Now**
   - Run: `curl https://kushi-cabs-production.up.railway.app/health`
   - If it works → DNS is ready, just rebuild/reinstall app
   - If it fails → DNS not ready, wait more

3. **Use Temporary Fix**
   - Use ngrok to expose local backend
   - Update `.env` with ngrok URL
   - Rebuild and test immediately

Which would you prefer?
