# Deploy Backend to Railway

The app is built with the production URL `https://kushi-cabs-production.up.railway.app`, but your backend is not deployed there yet. Here's how to deploy it:

## Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

## Step 2: Login to Railway

```bash
railway login
```

This will open a browser for you to authenticate with your Railway account.

## Step 3: Navigate to Backend Directory

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
```

## Step 4: Create/Link Railway Project

If you haven't created the Railway project yet:
```bash
railway init
```

If you already have the project, link to it:
```bash
railway link
```

## Step 5: Configure Environment Variables in Railway

Set the environment variables in Railway dashboard or via CLI:

```bash
railway variables set STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
railway variables set STPL_API_KEY=26568C0BBD2CEC
railway variables set STPL_SENDER_ID=KUSCAB
railway variables set STPL_ROUTE=TransAPI
railway variables set STPL_ROUTE_ID=13
railway variables set STPL_CAMPAIGN=0
railway variables set STPL_COUNTRY_CODE=91
railway variables set OTP_TTL_SECONDS=300
railway variables set SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I
```

## Step 6: Deploy

```bash
railway up
```

Railway will:
1. Build your Node.js app
2. Deploy it to the `kushi-cabs-production.up.railway.app` domain
3. Automatically restart when code changes

## Step 7: Verify Deployment

Once deployed, test the health endpoint:

```
https://kushi-cabs-production.up.railway.app/health
```

You should see:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"2026-07-15T..."}
```

## Troubleshooting

**Build fails or crashes?**
- Check Railway logs: `railway logs`
- Verify environment variables are set correctly
- Ensure `backend/package.json` has all dependencies

**Port issues?**
- Railway assigns the PORT dynamically - backend/index.js already uses `process.env.PORT || 4000` ✅

**Domain not working?**
- Wait 2-3 minutes after deployment
- Check that Railway shows "Running" status
- Clear app cache on phone and reinstall

## Next Steps

1. Deploy backend to Railway using steps above
2. Once deployed and verified, the app will connect automatically
3. Reinstall the app on your phone to use the production backend
