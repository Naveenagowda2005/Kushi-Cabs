# Railway Backend Setup - CORRECT Configuration

## IMPORTANT: Remove PORT=4000

❌ **REMOVE** `PORT=4000` from Railway Variables  
✅ **LET RAILWAY** assign the dynamic PORT automatically

Railway automatically assigns a dynamic PORT environment variable. The backend code already handles this:
```javascript
const port = process.env.PORT || 4000;  // Fallback for local dev only
```

## What TO Keep in Railway Variables

These are the environment variables that MUST be set in Railway:

| Variable | Value | Source |
|----------|-------|--------|
| STPL_API_URL | https://sms.hitechsms.com/app/smsapi/index.php | SMS provider |
| STPL_API_KEY | 26568C0BBD2CEC | SMS API key |
| STPL_SENDER_ID | KUSCAB | SMS sender name |
| STPL_ROUTE_ID | 13 | SMS route ID |
| STPL_COUNTRY_CODE | 91 | Country code (India) |
| OTP_TTL_SECONDS | 300 | OTP timeout |
| STPL_OTP_TEMPLATE_ID | 1707177980314073534 | SMS template ID |
| SUPABASE_URL | https://vofupwsnbcidjnifaihm.supabase.co | Database URL |
| SUPABASE_SERVICE_ROLE_KEY | [from backend/.env] | Admin database access |

## What NOT to Set

❌ PORT - Railway handles this automatically  
❌ NODE_ENV - Railway sets this appropriately  

## How Railway's Dynamic Port Works

1. Railway starts the container
2. Railway assigns a random available PORT (e.g., 8080, 5000, 3000, etc.)
3. Railway sets `process.env.PORT` to that value
4. Railway routes traffic to that port via the public domain: `https://kushi-cabs-production.up.railway.app`
5. Your backend listens on `0.0.0.0:{PORT}` ✅ (already correct in code)

## Steps to Fix

1. **Go to Railway dashboard** → Kushi-Cabs service → Variables
2. **Delete** the `PORT=4000` variable (if you added it)
3. **Verify** all SMS and Supabase variables are set
4. **Redeploy** the service
5. Wait 2-3 minutes for new deployment

## Backend Code is Already Correct

✅ Listening on `0.0.0.0` (all interfaces)
✅ Using `process.env.PORT` with fallback
✅ CORS enabled for mobile app
✅ Environment variable validation added

The backend will automatically work with whatever port Railway assigns!
