# Railway Deployment Guide for Taxi SMS Backend

## Quick Start

### 1. Install Railway CLI
```bash
npm install -g railway
```

### 2. Login to Railway
```bash
railway login
```
This will open a browser window to authenticate.

### 3. Navigate to Backend Directory
```bash
cd backend
```

### 4. Initialize Railway Project
```bash
railway init
```
- Choose a project name: `taxi-sms-backend`
- Select Node.js environment

### 5. Set Environment Variables
```bash
railway variables set STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
railway variables set STPL_API_KEY=26568C0BBD2CEC
railway variables set STPL_SENDER_ID=KUSCAB
railway variables set STPL_ROUTE=TransAPI
railway variables set STPL_ROUTE_ID=13
railway variables set STPL_CAMPAIGN=0
railway variables set STPL_COUNTRY_CODE=91
railway variables set OTP_TTL_SECONDS=300
railway variables set STPL_OTP_TEMPLATE_ID=1707177980314073534
railway variables set SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I
```

### 6. Deploy
```bash
railway up
```

This will:
- Build the application
- Deploy to Railway
- Provide you with a production URL

### 7. Get Production URL
After deployment, Railway will assign a domain. Check it with:
```bash
railway domains
```

Or view in Railway dashboard.

## Expected URL Format
Your backend will be available at: `https://kushi-cabs-production.up.railway.app`

## Verify Deployment
Test the health endpoint:
```bash
curl https://kushi-cabs-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "taxi-sms-backend",
  "timestamp": "2026-07-15T..."
}
```

## Test OTP Endpoint
```bash
curl -X POST https://kushi-cabs-production.up.railway.app/sms/otp \
  -H "Content-Type: application/json" \
  -d '{"to": "919686314982"}'
```

## Troubleshooting

### Build fails
- Ensure `package.json` has correct `start` script
- Check `Procfile` exists and is correct
- Verify all dependencies are installed locally: `npm install`

### Environment variables not set
- Use Railway CLI or dashboard to set them
- Restart deployment after setting variables: `railway up`

### CORS issues
- Backend has CORS enabled for all origins
- If issues persist, update CORS configuration in `index.js`

### SMS not sending
- Verify STPL credentials are correct
- Check HiTech SMS account has sufficient balance
- Review logs in Railway dashboard

## Redeploy After Code Changes
```bash
cd backend
git add .
git commit -m "Update SMS backend"
railway up
```

## View Live Logs
```bash
railway logs
```

## Environment Variables Reference
All variables should be set in Railway dashboard:
- `STPL_API_URL` - HiTech SMS API endpoint
- `STPL_API_KEY` - HiTech API Key
- `STPL_SENDER_ID` - Sender ID registered with HiTech
- `STPL_ROUTE` - Route type (TransAPI)
- `STPL_ROUTE_ID` - Route ID
- `STPL_CAMPAIGN` - Campaign ID
- `STPL_COUNTRY_CODE` - Country code (91 for India)
- `OTP_TTL_SECONDS` - OTP validity (300 = 5 minutes)
- `STPL_OTP_TEMPLATE_ID` - OTP template ID for HiTech
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Manual Deployment (Alternative)
If Railway CLI doesn't work:
1. Go to https://railway.app
2. Create new project
3. Select "Deploy from GitHub"
4. Connect your repository
5. Select the `backend` directory as root
6. Set environment variables in dashboard
7. Railway will auto-deploy on push
