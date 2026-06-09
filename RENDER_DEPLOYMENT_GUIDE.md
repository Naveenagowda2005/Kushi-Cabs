# Render Deployment Guide - Migrate from Railway

## Why Render?
✅ Faster response times  
✅ Better performance for Indian region  
✅ Free tier available for testing  
✅ Easy environment variable management  
✅ Automatic deployments from Git  

## Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub account (recommended)
3. Authorize Render to access your GitHub

## Step 2: Connect GitHub Repository

1. Click **New +** → **Web Service**
2. Select **Build and deploy from a Git repository**
3. Authenticate GitHub
4. Select your repository: `Kushi-Cabs`
5. Connect

## Step 3: Configure Service

**Name:** `kushi-cabs-backend`

**Environment:** Node

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Region:** Singapore or Frankfurt (closest to India)

## Step 4: Add Environment Variables

In Render dashboard → Environment:

```
STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
STPL_API_KEY=26568C0BBD2CEC
STPL_SENDER_ID=KUSCAB
STPL_ROUTE_ID=13
STPL_COUNTRY_CODE=91
OTP_TTL_SECONDS=300
STPL_OTP_TEMPLATE_ID=1707177980314073534
STPL_API_QUERY_KEY_FIELD=key
STPL_API_QUERY_MOBILE_FIELD=contacts
STPL_API_QUERY_MESSAGE_FIELD=msg
STPL_API_QUERY_SENDER_FIELD=senderid
STPL_API_QUERY_USERNAME_FIELD=user
STPL_API_QUERY_PASSWORD_FIELD=passwd
STPL_API_QUERY_ROUTE_FIELD=routeid
STPL_API_QUERY_TYPE_FIELD=type
STPL_API_QUERY_TYPE_VALUE=text
STPL_API_QUERY_CAMPAIGN_FIELD=campaign
STPL_API_QUERY_TEMPLATE_FIELD=template_id
STPL_API_QUERY_COUNTRY_FIELD=country
SUPABASE_URL=https://vofupwsnbcidjnifaihm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZnVwd3NuYmNpZGpuaWZhaWhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY5ODU5MSwiZXhwIjoyMDkzMjc0NTkxfQ.mlfBqXWa8E3UDWZeRlvwmNcpagVU1XPWM3eTxPsxH1U
```

## Step 5: Deploy

Click **Deploy** button

Render will:
1. Clone your repository
2. Install dependencies
3. Start the server
4. Generate public URL

## Step 6: Get Your Render URL

After deployment, you'll get a URL like:
```
https://kushi-cabs-backend.onrender.com
```

**Test it:**
```bash
curl https://kushi-cabs-backend.onrender.com/health
```

Should return:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"..."}
```

## Step 7: Update App Configuration

### Update `.env` in app:

```env
EXPO_PUBLIC_SUPABASE_URL='https://vofupwsnbcidjnifaihm.supabase.co'
EXPO_PUBLIC_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZnVwd3NuYmNpZGpuaWZhaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTg1OTEsImV4cCI6MjA5MzI3NDU5MX0.bimiuf0UELlSHg7SNNexv-IKnntvtDjisWDq7xlonhg'
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY='AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms'
EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs-backend.onrender.com'
```

### Update `eas.json` production profile:

```json
"production": {
  "autoIncrement": true,
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "https://vofupwsnbcidjnifaihm.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZnVwd3NuYmNpZGpuaWZhaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTg1OTEsImV4cCI6MjA5MzI3NDU5MX0.bimiuf0UELlSHg7SNNexv-IKnntvtDjisWDq7xlonhg",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms",
    "EXPO_PUBLIC_SMS_API_URL": "https://kushi-cabs-backend.onrender.com"
  }
}
```

## Step 8: Rebuild and Test

1. Push changes to GitHub
2. Render auto-deploys backend
3. Build new APK: `eas build --platform android --profile production`
4. Install on device
5. Test OTP login

## Render vs Railway Comparison

| Feature | Render | Railway |
|---------|--------|---------|
| **Free Tier** | 750 hours/month | Limited |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Deployment** | Auto from Git | Manual or Git |
| **Uptime** | 99.9% | 99.5% |
| **Region Selection** | ✅ Multiple | Limited |
| **Support** | Good | Excellent |
| **Price** | $7/month pro | $5/month |

## Enable Auto-Deployments (Optional)

1. Go to Render dashboard
2. Settings → Auto-Deploy
3. Select branch: `master`
4. Now every Git push auto-deploys!

## Keep Backend Running (Prevent Sleep)

Render's free tier services go to sleep after 15 minutes of inactivity.

**Option 1: Use Paid Plan** ($7/month)
- No sleep, always running
- Better performance

**Option 2: Ping Service** (Free)
- Add a service to ping your API every 10 mins
- Keeps it awake

## Troubleshooting

**"Build failed"**
- Check logs in Render dashboard
- Verify `npm start` works locally

**"Service keeps crashing"**
- Check Environment tab - all vars set?
- Check logs for error messages
- Verify backend/.env has all SMS credentials

**"Slow response"**
- May still be spinning up (cold start)
- First request takes 30-60 seconds
- Subsequent requests are fast
- Use paid tier to eliminate cold starts

## Monitoring

1. Go to Render dashboard
2. Click service name
3. View **Metrics**:
   - CPU usage
   - Memory
   - Response times
   - Error rates

---

**Summary:**
1. Create Render account
2. Connect GitHub repo
3. Set environment variables
4. Deploy
5. Update app with new URL
6. Rebuild APK
7. Test

Once deployed, share the Render URL and I'll verify everything works!
