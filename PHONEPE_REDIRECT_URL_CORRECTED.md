# PhonePe Redirect URL - Corrected for Mobile App ✅

## What Changed

The `FRONTEND_URL` in backend .env is now correctly set for your mobile app:

```
# BEFORE (Website URL - wrong for mobile app)
FRONTEND_URL=https://kushicabs.in

# AFTER (App scheme - correct for mobile app)
FRONTEND_URL=kushicabs://payment-status
```

## Why This Matters

PhonePe needs to redirect users back to your app after payment completes. The redirect URL must match your app's scheme:

**App Configuration:**
```json
"scheme": "kushicabs"
"package": "com.Kushi_Cabs"  (Android)
```

**PhonePe Redirect Flow:**

1. User completes payment in PhonePe
2. PhonePe uses redirect URL to bring user back:
   - **iOS**: `kushicabs://payment-status?orderId=...`
   - **Android**: `kushicabs://payment-status?orderId=...`
3. App receives the redirect via deep link
4. Frontend polling detects payment status change
5. Wallet updated automatically

## How It Works

### Before (Broken):
```
User pays in PhonePe
    ↓
PhonePe redirects to: https://kushicabs.in
    ↓
❌ URL doesn't work on mobile phone
    ❌ App doesn't receive deep link
```

### After (Fixed):
```
User pays in PhonePe
    ↓
PhonePe redirects to: kushicabs://payment-status
    ↓
✅ iOS opens app with deep link
✅ Android opens app with deep link
    ↓
App received redirect
    ↓
Polling detects payment status
    ↓
✅ Wallet credited
```

## Backend Configuration

Updated in `backend/.env`:

```
# Redirect URL for mobile app deep linking
FRONTEND_URL=kushicabs://payment-status

# PhonePe generates this redirect URL after payment:
redirectUrl: "kushicabs://payment-status?orderId=TXN_123_456..."
```

## Payment Flow After PhonePe

When user completes payment:

```
PhonePe → Sends Webhook → Backend receives status
       ↓
Sends redirect → kushicabs://payment-status
       ↓
App opens from deep link
       ↓
Frontend polling → Detects status = SUCCESS
       ↓
Wallet updated ✅
```

## Key Points

✅ **App Scheme**: `kushicabs://` - defined in app.json
✅ **Package Name**: `com.Kushi_Cabs` - Android package
✅ **Redirect URL**: Now points to app scheme (mobile-friendly)
✅ **Polling**: Still works as fallback (every 2 seconds)
✅ **Webhooks**: Backend confirms via webhook

## Testing

### What to Expect:

1. **User clicks Pay** → Enters amount
2. **Opens PhonePe** → Completes payment
3. **PhonePe redirects** → `kushicabs://payment-status?orderId=...`
4. **App opens** → Receives deep link
5. **Polling checks** → Detects SUCCESS status
6. **Wallet credits** → User sees "✅ Payment Successful"

### If Payment Not Detected:

Check that:
- ✅ PhonePe webhook is configured in merchant dashboard
- ✅ Webhook URL: `https://your-backend.com/api/phonepe/callback`
- ✅ Backend is receiving webhook confirmation

## What's Stored in Backend .env

```
PHONEPE_MERCHANT_ID=M18UH4EERGY0
PHONEPE_API_KEY=ba33ba9c-a4fc-4bea-bf2b-ble1f7c05fac
PHONEPE_ENV=production
FRONTEND_URL=kushicabs://payment-status  ✅ NOW CORRECT
BACKEND_URL=https://kushi-cabs-27p8.onrender.com
```

---

**Status**: ✅ Redirect URL corrected for mobile app
**App Scheme**: kushicabs://
**Environment**: Production
**Date**: August 7, 2026
