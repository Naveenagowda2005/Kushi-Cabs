# OTP Flow Testing Guide

## Status: ✅ OTP Service Fixed and Running

### What Was Fixed
1. **IP Address Mismatch**: Frontend was configured to use `192.168.1.111:4000` but backend was on `192.168.1.114:4000`
2. **Environment Configuration**: Updated to use `localhost:4000` for development testing
3. **Server Status**: Both Expo and Backend are now running correctly

## Current Setup

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend (Expo)** | `http://localhost:8081` | ✅ Running |
| **Backend SMS** | `http://localhost:4000` | ✅ Running |
| **SMS API (HiTech)** | `https://sms.hitechsms.com/app/smsapi/index.php` | ✅ Connected |

## How to Test OTP

### Option 1: Test via API (Fastest Way)

#### Step 1: Send OTP
```bash
curl -X POST http://localhost:4000/sms/otp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "9686314982",
    "purpose": "signup"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "otpSent": true,
  "purpose": "signup",
  "result": {
    "status": 200,
    "data": "SMS-SHOOT-ID or API response"
  }
}
```

#### Step 2: Verify OTP
```bash
# Use the OTP code generated in step 1
curl -X POST http://localhost:4000/sms/verify \
  -H "Content-Type: application/json" \
  -d '{
    "to": "9686314982",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "verified": true
}
```

---

### Option 2: Test via Mobile App (SignUp Screen)

1. **Open the app** on Expo Go or emulator
2. **Select "Driver"** role
3. **Tap "Create Driver Account"**
4. **Enter phone number**: `9686314982`
5. **Accept Terms & Conditions**
6. **Tap "Send OTP"**
   - Should show: "OTP has been sent to 9686314982"
7. **Enter 6-digit OTP**
   - Check your phone messages or backend logs
8. **Tap "Verify & Create Account"**
   - Should show: "OTP verified successfully"
9. **Fill registration form** and continue

---

## Debugging

### Check Backend Logs
The backend logs show OTP requests. Look for:
```
POST /sms/otp
Response: 200 OK
```

### Check Frontend Logs
In Expo, check console for:
```
LOG  Requesting OTP for new signup: 9686314982
LOG  OTP Response: {"success":true,"otpSent":true,...}
```

### Common Issues & Solutions

#### Issue 1: "OTP Request Error: AbortError"
**Cause**: Network timeout or backend unreachable

**Solution**:
- Verify backend is running: `npm start` in `backend/` folder
- Check SMS API URL in `.env`: should be `localhost:4000`
- Restart Expo: `Press r` in Expo terminal

#### Issue 2: "Unable to connect to the remote server"
**Cause**: IP address mismatch

**Solution**:
- For development: Use `http://localhost:4000` ✓
- For devices: Use `http://192.168.1.114:4000`
- Update `.env` and restart server

#### Issue 3: "Invalid OTP"
**Cause**: Wrong code entered or OTP expired

**Solution**:
- OTP valid for 5 minutes (300 seconds)
- Use the exact code sent to backend
- Request new OTP if expired

#### Issue 4: SMS Not Received
**Cause**: SMS API configuration or credentials

**Solution**:
- Verify backend `.env`:
  - `STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php` ✓
  - `STPL_API_KEY=26568C0BBD2CEC` ✓
  - `STPL_SENDER_ID=KUSCAB` ✓
- Verify phone format (10 digits, no +91)
- Check HiTech SMS account credits

---

## Architecture

```
┌──────────────┐
│  Frontend    │
│  (Expo)      │
│  localhost   │
│  :8081       │
└──────┬───────┘
       │ POST /sms/otp
       │ POST /sms/verify
       ↓
┌──────────────┐
│   Backend    │
│  (SMS Svc)   │
│  localhost   │
│  :4000       │
└──────┬───────┘
       │ HTTPS
       ↓
┌──────────────────────┐
│  HiTech SMS API      │
│  sms.hitechsms.com   │
│  (Live SMS Service)  │
└──────────────────────┘
```

---

## Files Modified

✅ `newtaxi/apps/unified/.env`
- Changed `EXPO_PUBLIC_SMS_API_URL` from `http://192.168.1.111:4000` to `http://localhost:4000`

✅ `backend/.env`
- Added `PORT=4000` for clarity

---

## Next Steps

1. **Test OTP via API** using curl commands above
2. **Test in App** using SignUp screen
3. **Verify SMS Delivery** to your phone
4. **Monitor Backend Logs** for errors
5. **Check Document Upload** workflow after registration
6. **Test Admin Approval** dashboard for verification

---

## Server Status Commands

### Check if Expo is running:
```bash
curl http://localhost:8081/health 2>&1 || echo "Not accessible"
```

### Check if Backend is running:
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","service":"taxi-sms-backend"}
```

### Check Environment Variables (Frontend):
```bash
# In Expo console, add this to App.js:
console.log('SMS API URL:', process.env.EXPO_PUBLIC_SMS_API_URL);
# Should log: http://localhost:4000
```

---

## Production Deployment

When deploying to production:

1. **Update Frontend `.env`**:
   ```env
   EXPO_PUBLIC_SMS_API_URL='https://your-server.com:4000'
   ```

2. **Update Backend `.env`**:
   ```env
   PORT=4000
   STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
   STPL_API_KEY=your_key
   ```

3. **Enable HTTPS** (use Let's Encrypt)
4. **Configure Firewall** to allow port 4000
5. **Update CORS** in backend if needed

---

## Success Checklist ✅

- [x] Backend SMS service working
- [x] OTP endpoint returns success
- [x] Frontend configured with correct URL
- [x] Expo server running with new `.env`
- [ ] OTP received on test phone
- [ ] OTP verification successful
- [ ] User registration complete
- [ ] Document upload working
- [ ] Admin verification dashboard accessible
- [ ] Driver approved and can login
