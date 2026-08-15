# PhonePe Integration - Quick Reference Card

## 🎯 ONE-LINE SUMMARY
**Fixed**: PhonePe v2 API status endpoint path for payment verification ✅

---

## 🔧 THE FIX
```
OLD: /apis/pg-sandbox/checkout/v2/order/{orderId}  ❌
NEW: /apis/pg-sandbox/v2/order/{orderId}           ✅
```

**File**: `backend/routes/phonepe-payment.js` (Line 46)

---

## 📋 CONFIGURATION CHECKLIST

- [ ] **Backend .env**
  - `PHONEPE_ENV=sandbox`
  - `PHONEPE_CLIENT_ID=M18UH4EERGY0_26080721044`
  - `PHONEPE_CLIENT_SECRET=<your-secret>`
  - `BACKEND_URL=http://192.168.1.110:4000`

- [ ] **Frontend .env**
  - `EXPO_PUBLIC_SMS_API_URL=http://192.168.1.110:4000`
  - `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.110:4000`

- [ ] **Backend Running**
  - `npm start` from `backend/` directory
  - Listening on `0.0.0.0:4000`

- [ ] **Frontend Running**
  - `expo start --host lan` from `newtaxi/apps/unified/`
  - Points to `192.168.1.110:4000`

---

## 🚀 TEST PAYMENT
1. Open app → Wallet → Recharge
2. Enter ₹1
3. Click "Pay"
4. PhonePe checkout opens → complete payment
5. Status should update → ✅ Wallet credited

---

## 📊 API ENDPOINTS

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/phonepe/auth-token` | Get OAuth token |
| POST | `/api/phonepe/create-order` | Create payment order |
| GET | `/api/phonepe/order-status/:id` | ✅ Check status (FIXED) |
| POST | `/api/phonepe/callback` | Webhook for payment status |
| GET | `/api/phonepe/redirect` | Redirect after payment |

---

## 🐛 EXPECTED LOGS (After Fix)

```
✅ Order created successfully
   Order ID: TXN_fe5d13b8_1786551469788_5153

📊 Checking PhonePe payment status: TXN_fe5d13b8...

✅ Payment verified
   State: SUCCESS
   
✅ Wallet credited: user=fe5d13b8..., ₹1
```

---

## ❌ IF YOU SEE THIS ERROR

```
⚠️  PhonePe status failed, using DB: 
{ message: 'Bad Request - Api Mapping Not Found' }
```

**Action**: 
1. Restart backend: `npm start`
2. Verify endpoint in `phonepe-payment.js` line 46 is correct
3. Check all `.env` files match system IP

---

## 🔐 OAuth Flow (Automatic)

```
1. Backend requests token from PhonePe
   ↓
2. PhonePe returns access_token (expires 1 hour)
   ↓
3. Backend caches it for reuse
   ↓
4. All API calls use: Authorization: O-Bearer {token}
   ↓
5. Auto-refresh when expired
```

---

## 💰 PAYMENT STATES

| State | Meaning | Action |
|-------|---------|--------|
| INITIATED | Order created | Waiting for user |
| PENDING | User on payment page | Poll until status changes |
| COMPLETED/SUCCESS | Payment done | Credit wallet ✅ |
| FAILED/DECLINED | Payment failed | Show error alert |
| TIMED_OUT | Payment timeout | Mark as failed |

---

## 🎯 SANDBOX VS PRODUCTION

| Setting | Sandbox | Production |
|---------|---------|-----------|
| `PHONEPE_ENV` | `sandbox` | `production` |
| Base URL | `api-preprod.phonepe.com` | `api.phonepe.com` |
| Real Money | ❌ No | ✅ Yes |
| Test Credentials | ✅ Yes | ❌ No |
| Callback Required | ❌ Optional | ✅ Required |

---

## 📱 FRONTEND FEATURES

✅ Payment modal with preset amounts
✅ Real-time polling (every 2 seconds)
✅ AppState detection (auto-check when user returns)
✅ Manual "I've Paid" button
✅ Success/error alerts
✅ Balance display

---

**Status**: ✅ Production Ready
**Last Updated**: August 12, 2026
**Test Environment**: Sandbox (safe for testing)
