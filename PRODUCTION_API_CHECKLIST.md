# Production API Endpoints Checklist

## Current Status
⚠️ **ISSUE DETECTED**: The app is configured to use a local IP address in production, which will NOT work!

---

## API Configuration Files

### 1. `.env` File (CURRENT - FOR LOCAL DEV)
```
EXPO_PUBLIC_SMS_API_URL='http://192.168.1.110:4000'
```
❌ This is a LOCAL IP - won't work in production!

---

## What Needs to Change for Production

### STEP 1: Update `.env` with Production URL
Replace the local IP with your actual production backend URL:

```bash
# OLD (Local Development)
EXPO_PUBLIC_SMS_API_URL='http://192.168.1.110:4000'

# NEW (Production - Replace with your actual server)
EXPO_PUBLIC_SMS_API_URL='https://your-production-server.com/taxi-backend'
```

### STEP 2: Backend Production URL
Your backend should be running on:
- Domain: `your-production-server.com`
- Port: `443` (HTTPS) or `80` (HTTP)
- Should NOT be `localhost` or IP addresses
- Should use HTTPS for security

---

## API Endpoints Used in App

### SMS & Auth Endpoints (Backend)
```javascript
// Location: src/context/AuthContext.js, src/screens/auth/LoginScreen.js
POST /sms/otp                    // Send OTP
POST /sms/verify                 // Verify OTP
POST /admin/create-driver-account // Create driver auth account
```

### Admin Endpoints (Backend)
```javascript
// Location: src/screens/superadmin/
POST /admin/delete-user          // Delete user
POST /admin/update-admin-phone   // Update admin phone
POST /admin/create-dummy-driver  // Create dummy driver
GET  /admin/dummy-drivers        // List dummy drivers
```

### Supabase Endpoints (Database)
```
All database operations use Supabase directly:
- EXPO_PUBLIC_SUPABASE_URL: https://vofupwsnbcidjnifaihm.supabase.co ✅
- EXPO_PUBLIC_SUPABASE_ANON_KEY: (already set) ✅
```

### Google Maps API
```
- EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: (already set) ✅
```

---

## Production Setup Guide

### Option 1: Using Railway (Recommended for Backend)
1. Deploy backend to Railway.com
2. Get production URL: `https://your-app.railway.app`
3. Update `.env`:
   ```
   EXPO_PUBLIC_SMS_API_URL='https://your-app.railway.app'
   ```

### Option 2: Using Your Own Server
1. Deploy backend with domain: `your-domain.com`
2. Ensure HTTPS is enabled (use Let's Encrypt)
3. Update `.env`:
   ```
   EXPO_PUBLIC_SMS_API_URL='https://your-domain.com'
   ```

### Option 3: Using AWS/Azure/GCP
1. Deploy backend to cloud platform
2. Get production URL from your platform
3. Update `.env` with that URL

---

## Verification Checklist

Before building production APK/AAB:

- [ ] Backend is running on HTTPS
- [ ] Backend URL is NOT a local IP (192.168.x.x)
- [ ] Backend URL is NOT localhost
- [ ] `.env` has correct `EXPO_PUBLIC_SMS_API_URL`
- [ ] Supabase URL is correct
- [ ] Google Maps API key is valid
- [ ] CORS is enabled on backend for mobile apps
- [ ] Backend endpoints respond with 200 status
- [ ] SSL certificate is valid (not self-signed)

---

## Testing Production URLs

Before APK build, test:

```bash
# Test SMS endpoint
curl -X POST https://your-production-server.com/sms/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999"}'

# Test Admin endpoint
curl -X GET https://your-production-server.com/admin/dummy-drivers
```

---

## Current Backend Status

Your backend is currently configured for:
- Local development only
- Runs on: `http://192.168.1.110:4000`
- Port: 4000

**For production APK to work, backend must be:**
- Running on a publicly accessible server
- Using HTTPS protocol
- Accessible from anywhere (not just local network)

---

## Action Required

1. **Decide on backend hosting** (Railway, AWS, Azure, etc.)
2. **Deploy backend** to production server
3. **Get production URL** from your hosting provider
4. **Update `.env`** with production URL
5. **Build new APK** with updated configuration
6. **Test all endpoints** in production APK

Without this change, production APK will fail to:
- Send OTP
- Verify users
- Perform admin operations
