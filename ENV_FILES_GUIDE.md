# 🔐 Environment Variables Guide

## Overview

The Kushi-Cabs project uses two `.env` files:

1. **Frontend** - `newtaxi/apps/unified/.env` (React Native/Expo app)
2. **Backend** - `backend/.env` (Node.js API server)

Both files are created and ready to use!

---

## File Locations

### Frontend .env
```
newtaxi/apps/unified/.env
```

**Contains:**
- Supabase configuration
- Google Maps API key
- Backend API URL
- Development settings

### Backend .env
```
backend/.env
```

**Contains:**
- Supabase service role key
- SMS gateway credentials
- Payment gateway keys
- Email configuration
- Database settings

---

## Frontend .env File

### Location
```
c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified\.env
```

### Configuration

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms

# Backend API
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-27p8.onrender.com

# Development
DEBUG=false
ENVIRONMENT=production
```

### What Each Variable Does

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Database URL | `https://...supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Database API key (public) | JWT token |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps API key | `AIzaSy...` |
| `EXPO_PUBLIC_SMS_API_URL` | Backend server URL | `https://...onrender.com` |
| `DEBUG` | Debug mode | `true` or `false` |
| `ENVIRONMENT` | Environment | `production` or `development` |

### Important Notes

⚠️ **EXPO_PUBLIC_* variables are PUBLIC**
- These are visible in the app code
- Do NOT put secret keys here
- Only use for non-sensitive data

✅ **Currently configured for:**
- Production Supabase database
- Production Google Maps API
- Production backend (Render.com)

---

## Backend .env File

### Location
```
c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\backend\.env
```

### Configuration Sections

#### Server
```env
PORT=8080
NODE_ENV=production
```

#### Supabase (Database)
```env
SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### SMS Gateway (STPL)
```env
STPL_API_URL=https://sms.hitechsms.com/app/smsapi/index.php
STPL_API_KEY=your_api_key_here
STPL_USERNAME=your_username_here
STPL_PASSWORD=your_password_here
STPL_SENDER_ID=KUSCAB
OTP_TTL_SECONDS=300
```

#### Payment Gateway (PhonePe)
```env
PHONEPE_MERCHANT_ID=your_merchant_id_here
PHONEPE_API_KEY=your_api_key_here
PHONEPE_API_URL=https://api.phonepe.com/apis/hermes
PHONEPE_ENVIRONMENT=PRODUCTION
```

#### Razorpay (Optional)
```env
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

#### Email (Optional)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

#### AWS S3 (Optional)
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

---

## How Environment Variables Work

### In Frontend (React Native)

```javascript
import { SUPABASE_URL } from '@env';

// Access environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Only EXPO_PUBLIC_* variables are accessible
// Others are stripped out during build
```

### In Backend (Node.js)

```javascript
require('dotenv').config();

// Access environment variables
const port = process.env.PORT;
const supabaseUrl = process.env.SUPABASE_URL;
const phonepeKey = process.env.PHONEPE_API_KEY;

// All variables are accessible
```

---

## Current Configuration Status

### ✅ Frontend (.env) - Ready
```
EXPO_PUBLIC_SUPABASE_URL ✓ Configured
EXPO_PUBLIC_SUPABASE_ANON_KEY ✓ Configured
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ✓ Configured
EXPO_PUBLIC_SMS_API_URL ✓ Configured
```

### ✅ Backend (.env) - Ready
```
SUPABASE_URL ✓ Configured
SUPABASE_SERVICE_ROLE_KEY ✓ Configured
SMS Gateway ⚠️ Needs your credentials
Payment Gateway ⚠️ Needs your credentials
```

---

## What You Need To Update

### For Backend to Work Properly

You need to update these with YOUR credentials:

#### 1. SMS Gateway (STPL)
```env
STPL_API_KEY=your_api_key_here          # Get from STPL dashboard
STPL_USERNAME=your_username_here        # Your STPL username
STPL_PASSWORD=your_password_here        # Your STPL password
```

**Where to get:**
- Register at: https://www.hitechsms.com
- Get credentials from your STPL account
- Add to `.env` file

#### 2. PhonePe Payment
```env
PHONEPE_MERCHANT_ID=your_merchant_id_here   # From PhonePe dashboard
PHONEPE_API_KEY=your_api_key_here           # From PhonePe dashboard
```

**Where to get:**
- Register at: https://www.phonepe.com/business
- Create merchant account
- Get credentials from dashboard
- Add to `.env` file

#### 3. Other Services (Optional)
- Razorpay (alternative payment)
- AWS S3 (file storage)
- Email service

---

## Security Best Practices

### ✅ DO

```
✓ Add .env to .gitignore (prevents commit)
✓ Keep secrets in .env files only
✓ Use different keys for dev/prod
✓ Rotate keys regularly
✓ Use strong JWT secret
✓ Keep .env file on server secure
```

### ❌ DON'T

```
✗ Commit .env to git
✗ Share credentials in chat/email
✗ Use weak API keys
✗ Expose secrets in frontend
✗ Use same credentials for all environments
✗ Leave default example credentials
```

---

## Running with .env Files

### Frontend (Expo)

```bash
cd newtaxi/apps/unified

# Start with environment variables
npm start

# Or build with EAS
eas build --platform android --profile production
```

### Backend (Node.js)

```bash
cd backend

# Install dependencies (if not done)
npm install

# Start with environment variables
npm run dev    # Development with nodemon
npm start      # Production

# dotenv automatically loads from .env file
```

---

## Troubleshooting

### Problem: "Environment variable not found"

**Solution:**
```
1. Check .env file exists in correct location
2. Verify variable name is correct
3. Restart development server
4. Check for typos in .env
```

### Problem: "Connection refused to Supabase"

**Solution:**
```
1. Verify SUPABASE_URL is correct
2. Check internet connection
3. Verify Supabase project is active
4. Check SUPABASE_ANON_KEY is valid
```

### Problem: "SMS not sending"

**Solution:**
```
1. Verify STPL credentials are correct
2. Check STPL account has balance
3. Verify API URL is correct
4. Check OTP template ID
```

### Problem: "PhonePe payment failing"

**Solution:**
```
1. Verify PHONEPE_MERCHANT_ID
2. Verify PHONEPE_API_KEY
3. Check environment (PRODUCTION vs STAGING)
4. Verify redirect URL is correct
```

---

## Environment Stages

### Development
```env
NODE_ENV=development
DEBUG=true
PHONEPE_ENVIRONMENT=STAGING
```

### Production
```env
NODE_ENV=production
DEBUG=false
PHONEPE_ENVIRONMENT=PRODUCTION
```

---

## File Structure

```
Kushi-Cabs/
├── newtaxi/apps/unified/
│   └── .env                    ← Frontend config (created ✓)
│
├── backend/
│   ├── .env                    ← Backend config (created ✓)
│   └── .env.example            ← Template reference
│
└── .gitignore                  ← Should include: .env
```

---

## Checklist

- [x] Frontend .env created
- [x] Backend .env created
- [ ] Update SMS gateway credentials (if using SMS)
- [ ] Update PhonePe credentials (if using payments)
- [ ] Test SMS sending
- [ ] Test payments
- [ ] Verify Supabase connection
- [ ] Verify Google Maps API
- [ ] Test on device
- [ ] Deploy to production

---

## Summary

✅ **Both .env files are created and ready**

### Frontend .env
- Contains Supabase, Google Maps, and backend URL
- Configured for production
- No action needed - ready to use

### Backend .env
- Contains database, SMS, payment, and service credentials
- Partially configured (needs SMS and payment credentials)
- Update STPL_* and PHONEPE_* with your actual credentials

**Next Step:** Add your SMS gateway and payment gateway credentials to `backend/.env` for full functionality!

