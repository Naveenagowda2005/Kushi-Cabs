# Deploy SMS Backend to Render

## Step 1: Create Render Account
Go to https://render.com and sign up

## Step 2: Connect GitHub Repository
1. Click "New +" button
2. Select "Web Service"
3. Click "Connect a repository"
4. Search for "Kushi-Cabs" repository
5. Click "Connect"

## Step 3: Configure Web Service
- **Name**: `taxi-sms-backend`
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Plan**: Select "Free" or "Starter"

## Step 4: Set Environment Variables
Click "Environment" and add:
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
PORT=8080
```

## Step 5: Deploy
Click "Create Web Service"

Render will:
- Auto-detect Node.js
- Install dependencies
- Start the service
- Assign a public URL

## Step 6: Get Your Production URL
After deployment completes, you'll see a URL like:
```
https://taxi-sms-backend.onrender.com
```

## Step 7: Update App Configuration
Update `.env` in `newtaxi/apps/unified/.env`:
```
EXPO_PUBLIC_SMS_API_URL=https://taxi-sms-backend.onrender.com
```

## Step 8: Rebuild AAB
```bash
cd newtaxi/apps/unified
eas build --platform android --build-profile production
```

## Step 9: Test
```bash
curl https://taxi-sms-backend.onrender.com/health
```

Should return:
```json
{"status":"ok","service":"taxi-sms-backend","timestamp":"..."}
```

## Key Differences from Railway

| Feature | Railway | Render |
|---------|---------|--------|
| Node.js Support | ✅ Good | ✅ Excellent |
| Health Checks | ⚠️ Complex | ✅ Simple |
| Stability | ⚠️ Issues | ✅ Reliable |
| Free Tier | Limited | Good |
| Auto-restart | ⚠️ Problems | ✅ Works |

## Notes

- Render handles health checks automatically
- Free tier sleeps after 15 min inactivity (paid tier is continuous)
- Much more stable than Railway for Node.js
- Better documentation and support

## If You Hit Issues

1. Check Render Logs:
   - Dashboard → Service → Logs

2. Restart Service:
   - Dashboard → Service → Manual Deploy

3. Verify Environment Variables:
   - Dashboard → Service → Environment

That's it! Render is much simpler and more reliable for this use case.
