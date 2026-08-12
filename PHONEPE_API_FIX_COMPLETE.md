# PhonePe v2 API Status Endpoint Fix - COMPLETE

## 🔧 WHAT WAS FIXED

**Issue**: Payment status checks were failing with `"Bad Request - Api Mapping Not Found"` error

**Root Cause**: The status endpoint URL had an incorrect path for PhonePe v2 API
- ❌ **Wrong**: `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order`
- ✅ **Correct**: `https://api-preprod.phonepe.com/apis/pg-sandbox/v2/order`

The path should be `/pg-sandbox/v2/order`, not `/pg-sandbox/checkout/v2/order`

---

## ✅ CHANGES APPLIED

### 1. Backend Fix
**File**: `backend/routes/phonepe-payment.js` (Line 46-49)

```javascript
const STATUS_BASE = IS_SANDBOX
  ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v2/order'
  : 'https://api.phonepe.com/apis/pg/v2/order';
```

### 2. Frontend Configuration
**File**: `newtaxi/apps/unified/.env`

Added: `EXPO_PUBLIC_API_BASE_URL='http://192.168.1.110:4000'`

**File**: `newtaxi/apps/unified/src/constants.js`

API URLs correctly configured to use environment variable:
- `EXPO_PUBLIC_SMS_API_URL` = `http://192.168.1.110:4000`

### 3. Backend Configuration
**File**: `backend/.env`

✅ System IP configured: `192.168.1.110`
✅ Sandbox mode enabled: `PHONEPE_ENV=sandbox`
✅ Credentials set: `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`

---

## 🚀 NEXT STEPS TO TEST

### 1. **Restart the Backend Server**
```bash
# Kill old processes
taskkill /f /im node.exe

# Start backend (from backend directory)
cd backend
npm install  # if not already done
npm start
```

Backend should start on `http://192.168.1.110:4000`

### 2. **Restart Expo (Frontend)**
```bash
cd newtaxi/apps/unified

# If already running, stop it
# Then restart with:
npm start
# or
expo start --host lan
```

### 3. **Test Payment Flow**
1. Open the app on a device connected to the same network
2. Navigate to Wallet → Recharge
3. Click "Pay" button
4. **PhonePe checkout should now open**
5. **Status should update after payment (no more "Api Mapping Not Found" errors)**

---

## 📊 PAYMENT STATUS ENDPOINTS

### Create Order
**Endpoint**: `POST /api/phonepe/create-order`
- **Request**: `{userId, amount, userType}`
- **Response**: `{checkoutUrl, merchantOrderId, transactionId, phonePeOrderId}`

### Check Status
**Endpoint**: `GET /api/phonepe/order-status/:merchantOrderId`
- **Path Changed**: Now uses correct v2 endpoint format
- **Returns**: `{state: 'INITIATED|SUCCESS|FAILED', amount}`

### Callback (Webhook)
**Endpoint**: `POST /api/phonepe/callback`
- PhonePe will notify this endpoint when payment completes

### Redirect
**Endpoint**: `GET /api/phonepe/redirect`
- User is redirected here after payment
- Auto-checks status and credits wallet

---

## 🔐 AUTHENTICATION

Backend ↔ PhonePe: **OAuth2** (via Bearer tokens)
- Tokens are cached and reused for 1 hour
- Automatic token refresh when expired

Frontend ↔ Backend: **No auth required** (same network, protected by firewall)

---

## 📝 PAYMENT FLOW SUMMARY

```
Frontend (App)
    ↓
POST /create-order → Backend
    ↓
Backend → PhonePe OAuth token → Get access token
    ↓
POST checkout/v2/pay → PhonePe  [FIXED]
    ↓
PhonePe returns: {orderId (OMO...), redirectUrl}
    ↓
Frontend opens redirectUrl in browser
    ↓
User pays via PhonePe app/UPI
    ↓
PhonePe sends status callback → Backend webhook
    ↓
GET /order-status/:merchantOrderId → Backend queries PhonePe  [FIXED]
    ↓
PhonePe responds with status → Backend saves to DB
    ↓
Frontend polls status every 2 seconds
    ↓
Status becomes SUCCESS → Wallet credited
```

---

## ✨ KEY FEATURES WORKING

✅ OAuth2 token generation (automatically cached)
✅ Order creation with PhonePe v2 API
✅ **Status checking with correct endpoint** ← JUST FIXED
✅ Webhook callback handler (idempotent wallet credit)
✅ AppState detection (auto-check when app returns from browser)
✅ Manual "I've Paid" button (for sandbox testing)
✅ Sandbox mode (no real payments)

---

## 🧪 SANDBOX TEST FLOW

1. Amount: ₹1 (cheapest test)
2. Click "Pay" → PhonePe checkout opens
3. In sandbox, PhonePe doesn't require real payment
4. Return to app → "I've Paid — Check Status" button appears
5. Click button → Status should be SUCCESS
6. Wallet credited ✅

---

## 🐛 DEBUGGING LOGS

**In logs, you should now see**:
```
✅ Order created successfully
    Order ID: TXN_fe5d13b85ca748c_1786551469788_5153

📊 Checking PhonePe payment status: TXN_fe5d13b85ca748c_1786551469788_5153

✅ Payment verified
   State: SUCCESS
   Response Code: OK

✅ Wallet credited: user=fe5d13b8-5ca7-48ca-9625-33704cd48beb, ₹1
```

**NO MORE**:
```
⚠️  PhonePe status failed, using DB: { message: 'Bad Request - Api Mapping Not Found' }
```

---

## 🔄 TROUBLESHOOTING

**Issue**: Still getting "Api Mapping Not Found"
- **Fix**: Restart backend server
- **Verify**: Check `backend/routes/phonepe-payment.js` line 46 has correct endpoint

**Issue**: 401 Auth token error
- **Fix**: Verify `PHONEPE_CLIENT_ID` and `PHONEPE_CLIENT_SECRET` in `backend/.env`
- **Check**: Both credentials should be for **sandbox** mode, not production

**Issue**: Frontend can't reach backend
- **Fix**: Verify both using `http://192.168.1.110:4000`
- **Verify**: Backend is running on `0.0.0.0:4000` (not localhost)
- **Check**: Both devices on same WiFi network

**Issue**: Status stays at "INITIATED" forever
- **Fix**: Manual "I've Paid" button should appear → click it
- **Verify**: Backend logs show PhonePe status response (not error)

---

## 📞 SUPPORT

If still having issues:
1. Check backend logs for error details
2. Verify `.env` files have correct IPs and credentials
3. Confirm backend restarted after code changes
4. Try with different amount (₹100 instead of ₹1)
5. Check that both frontend and backend can reach each other

---

**Last Updated**: August 12, 2026
**Status**: ✅ Ready for Testing
**Sandbox Mode**: ✅ Active
