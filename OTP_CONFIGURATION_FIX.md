# OTP Configuration Fix - SMS Service Connection

## Problem Identified
OTP was not being sent because the frontend was configured with an incorrect backend IP address (`192.168.1.111:4000`) while the backend was actually running on a different IP (`192.168.1.114:4000`).

## Root Cause
- **Configured IP**: `http://192.168.1.111:4000` (in `.env`)
- **Actual Backend IP**: `http://192.168.1.114:4000` (from backend console logs)
- **Result**: Connection refused, OTP requests failed

## Solution Applied

### 1. Updated Frontend Configuration
**File**: `newtaxi/apps/unified/.env`
```env
EXPO_PUBLIC_SMS_API_URL='http://localhost:4000'
```

**Reason**: For development on the same machine, use `localhost` instead of IP address. When the Expo app runs on:
- **Development Machine (Web/Desktop)**: Use `localhost:4000` ✓
- **Physical Device or Emulator**: Use the actual machine IP (e.g., `192.168.1.114:4000`)

### 2. Backend Configuration
**File**: `backend/.env`
```env
PORT=4000
```

The backend:
- Listens on `0.0.0.0:4000` (all interfaces)
- Reports "Access from phone at: http://192.168.1.114:4000"
- Correctly responds to OTP requests ✓

## Test Results

### OTP Endpoint Test (Localhost)
```bash
POST /sms/otp
Response: 200 OK
{
  "success": true,
  "otpSent": true,
  "purpose": "test",
  "result": { ... }
}
```

✅ **SMS Service is Working**

## How to Use in Different Scenarios

### Scenario 1: Development on Local Machine (Current)
- Frontend: `http://localhost:4000`
- Backend: Running on `192.168.1.114:4000` (use this for physical devices)
- Status: ✅ OTP Sending Works

### Scenario 2: Testing on Physical Device or Android Emulator
1. Find your machine IP address:
   ```bash
   ipconfig
   # Look for "IPv4 Address: 192.168.x.x"
   ```

2. Update frontend `.env`:
   ```env
   EXPO_PUBLIC_SMS_API_URL='http://192.168.1.114:4000'  # Replace with your actual IP
   ```

3. Ensure Android device/emulator can reach the backend:
   ```bash
   # From device terminal
   ping 192.168.1.114
   curl http://192.168.1.114:4000/health
   ```

### Scenario 3: Production Deployment
- Use actual server IP or domain name
- Update both frontend and backend configurations
- Ensure firewall allows access to port 4000

## Backend Environment Variables

```env
# SMS API Configuration (HiTech SMS)
STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
STPL_API_KEY=26568C0BBD2CEC
STPL_SENDER_ID=KUSCAB
STPL_ROUTE_ID=13
STPL_OTP_TEMPLATE_ID=1707177980314073534

# Server Configuration
PORT=4000
OTP_TTL_SECONDS=300
STPL_COUNTRY_CODE=91
```

## Frontend Environment Variables

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL='https://vofupwsnbcidjnifaihm.supabase.co'
EXPO_PUBLIC_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY='AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms'

# SMS Service (use localhost for development, IP address for devices)
EXPO_PUBLIC_SMS_API_URL='http://localhost:4000'
```

## Testing the OTP Flow

### Step 1: Request OTP
```bash
POST http://localhost:4000/sms/otp
Content-Type: application/json

{
  "to": "9686314982",
  "purpose": "signup"
}
```

### Step 2: Verify OTP
```bash
POST http://localhost:4000/sms/verify
Content-Type: application/json

{
  "to": "9686314982",
  "otp": "123456"  # OTP returned from step 1
}
```

## Troubleshooting

### Issue: "Unable to connect to the remote server"
**Solution**: 
- Check if backend is running: `npm start` in `backend/` directory
- Verify SMS_API_URL in frontend `.env` matches your setup
- On physical device: Use `192.168.x.x` instead of `localhost`

### Issue: "OTP not received"
**Solution**:
- Verify HiTech SMS API credentials in `backend/.env`
- Check phone number format (must be 10 digits without +91)
- Verify SMS API template ID matches: `1707177980314073534`
- Check backend logs for HTTP errors

### Issue: "OTP verification fails"
**Solution**:
- Ensure you entered the correct OTP
- OTP expires after 5 minutes (300 seconds)
- Each phone number can only have one active OTP

## Status ✅

| Component | Status | Details |
|-----------|--------|---------|
| Backend SMS Service | ✅ Working | Listening on `0.0.0.0:4000` |
| OTP Endpoint | ✅ Working | Returns success on request |
| HiTech SMS API | ✅ Connected | API credentials verified |
| Frontend Configuration | ✅ Updated | Changed to `http://localhost:4000` |
| Device Testing | ⏳ Ready | Use `192.168.1.114:4000` when ready |
