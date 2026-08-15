# 🚀 IMMEDIATE ACTIONS - PhonePe API Fix

## ✅ WHAT HAS BEEN FIXED

The payment status endpoint has been corrected:
- ❌ **Old**: `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order`
- ✅ **New**: `https://api-preprod.phonepe.com/apis/pg-sandbox/v2/order`

**File Changed**: `backend/routes/phonepe-payment.js` (Line 46)

---

## 📋 YOUR ACTION CHECKLIST

### STEP 1: Restart the Backend
```
1. Open terminal/PowerShell
2. Navigate to: C:\Users\navee\OneDrive\Desktop\TAXI\backend
3. Kill any running node processes:
   taskkill /f /im node.exe
4. Start backend:
   npm start
5. Verify: Should see "📱 PhonePe v2 Config" message
```

### STEP 2: Restart the Frontend
```
1. Open new terminal/PowerShell
2. Navigate to: C:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
3. Stop any running Expo process (Ctrl+C)
4. Start Expo:
   npm start
   (or: expo start --host lan)
5. Scan QR code on phone
```

### STEP 3: Test Payment Flow
```
1. Open app on phone/emulator
2. Navigate to: Wallet → Recharge
3. Enter amount: ₹1 (cheapest test)
4. Tap "Pay ₹1" button
5. PhonePe checkout should open (no errors)
6. Choose to pay (or in sandbox, just navigate back)
7. Status should update in app
8. Check: Wallet balance increased ✅
```

---

## 🔍 VERIFICATION CHECKLIST

- [ ] Backend started without errors
  - Should see: `📱 PhonePe v2 Config`
  - Should show: `Client ID: M18UH4EERGY0_...`
  
- [ ] Frontend connected to backend
  - Backend .env: `BACKEND_URL=http://192.168.1.110:4000`
  - Frontend .env: `EXPO_PUBLIC_SMS_API_URL=http://192.168.1.110:4000`
  
- [ ] Payment initiated successfully
  - Logs should show: `✅ Order created successfully`
  - PhonePe checkout URL generated
  
- [ ] Status checking works (THIS IS THE FIX)
  - Logs should show: `📊 Checking PhonePe payment status`
  - NO ERROR: `"Bad Request - Api Mapping Not Found"`
  - Should show: `✅ Payment verified` with state
  
- [ ] Wallet credited
  - Logs: `✅ Wallet credited: user=..., ₹1`
  - App shows: Balance increased by ₹1
  - Alert shows: "Payment Successful" ✅

---

## 📊 WHAT TO EXPECT IN LOGS

### Backend Logs (Terminal)
```
📱 PhonePe v2 Config
   Client ID  : M18UH4EERGY0_26080721044
   Env        : SANDBOX
   Auth URL   : https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token
   Pay URL    : https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay

[After user initiates payment]

🔑 Fetching new PhonePe OAuth token...
✅ Token received, expires_at: 1786551469

📱 Creating PhonePe order: TXN_fe5d13b8..., ₹1 (100 paisa)
✅ PhonePe response: {"orderId":"OMO26081221...","state":"PENDING",...}

📊 Checking PhonePe payment status: TXN_fe5d13b8...
🔐 Using cached auth token (expires in 3376s)
✅ Payment verified
   State: INITIATED
   Response Code: undefined

✅ Payment status: INITIATED
📊 Poll #1: Status = INITIATED
...
[After user pays]
✅ Payment verified
   State: COMPLETED
✅ Wallet credited: user=fe5d13b8-5ca7-48ca-9625-33704cd48beb, ₹1
```

### Frontend Logs (React Native Console)
```
💳 Initiating payment for ₹1
💳 Initiating PhonePe payment
   User: fe5d13b8-5ca7-48ca-9625-33704cd48beb
   Amount: ₹1
   Type: driver

📱 Creating PhonePe order...
🔐 Using cached auth token (expires in 3511s)
✅ Order created successfully
   Order ID: TXN_fe5d13b8...
   Transaction ID: TXN_fe5d13b8...
   Checkout URL: https://mercury-uat.phonepe.com/transact/uat_v3?token=...

🔗 Opening PhonePe checkout...
📊 Starting status polling for TXN_fe5d13b8...
📊 Checking PhonePe payment status: TXN_fe5d13b8...
✅ Payment status: INITIATED
📊 Poll #1: Status = INITIATED
...
[When user returns from PhonePe]
✅ Payment verified
   State: COMPLETED
✅ Payment successful!
```

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue: Still Seeing "Api Mapping Not Found"
**Cause**: Old code still running
**Solution**:
1. Stop backend: `taskkill /f /im node.exe`
2. Check file: `backend/routes/phonepe-payment.js` line 46
3. Should be: `https://api-preprod.phonepe.com/apis/pg-sandbox/v2/order`
4. Restart: `npm start`

### Issue: 401 Unauthorized Error
**Cause**: Wrong credentials or sandbox mode mismatch
**Solution**:
1. Check `backend/.env`:
   - `PHONEPE_ENV=sandbox` ✅
   - `PHONEPE_CLIENT_ID=M18UH4EERGY0_26080721044` ✅
   - `PHONEPE_CLIENT_SECRET=<your-secret>` ✅
2. Verify credentials are for **sandbox**, not production

### Issue: Frontend Can't Reach Backend
**Cause**: IP mismatch or backend not running
**Solution**:
1. Verify backend running: `netstat -ano | findstr :4000`
2. Check IPs match (should be `192.168.1.110` for all)
3. Both on same WiFi network
4. Try: `curl http://192.168.1.110:4000/` from phone browser

### Issue: Status Stays at "INITIATED" Forever
**Cause**: Status polling not getting updates
**Solution**:
1. Click "I've Paid — Check Status" button manually
2. Check backend logs for errors
3. Verify PhonePe auth token is being generated
4. Try different amount (₹100 instead of ₹1)

### Issue: Payment Successful but Wallet Not Credited
**Cause**: Webhook or polling didn't trigger wallet credit
**Solution**:
1. Check logs for: `✅ Wallet credited`
2. Manually check wallet_transactions table
3. Verify external_reference_id matches transaction
4. Check user_id is correct

---

## 🎯 EXPECTED BEHAVIOR

### Before Fix (❌ Not Working)
```
POST create-order → Works ✅
GET /order-status → "Bad Request - Api Mapping Not Found" ❌
Status stays INITIATED forever ❌
Wallet never credited ❌
```

### After Fix (✅ Working)
```
POST create-order → Works ✅
GET /order-status → Returns state: "COMPLETED" ✅
Status updates to SUCCESS ✅
Wallet credited automatically ✅
User sees "Payment Successful" alert ✅
```

---

## 🔄 QUICK REFERENCE: KEY ENDPOINTS

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/phonepe/auth-token` | POST | Get OAuth token | ✅ Working |
| `/api/phonepe/create-order` | POST | Create payment | ✅ Working |
| `/api/phonepe/order-status/:id` | GET | Check status | ✅ FIXED |
| `/api/phonepe/callback` | POST | Webhook | ✅ Working |
| `/api/phonepe/redirect` | GET/POST | After payment | ✅ Working |

---

## 📞 DEBUG COMMANDS

### Check Backend is Running
```powershell
netstat -ano | findstr :4000
# Should show: TCP 0.0.0.0:4000 LISTENING
```

### Check Frontend Connected to Backend
```
In app console, should see:
🔌 Using SMS API URL: http://192.168.1.110:4000
```

### Check Network Between Devices
```powershell
ping 192.168.1.110
# Should get responses, not "Destination host unreachable"
```

### View Database Transactions
```sql
SELECT * FROM phonepe_transactions 
ORDER BY created_at DESC 
LIMIT 5;

SELECT * FROM wallet_transactions 
WHERE user_id = 'fe5d13b8-...' 
ORDER BY created_at DESC;
```

---

## ✨ SUCCESS INDICATORS

You'll know the fix is working when:

1. ✅ Backend shows: `✅ Order created successfully`
2. ✅ Backend shows: `✅ Payment verified` (not error)
3. ✅ Status becomes: `COMPLETED` or `SUCCESS`
4. ✅ Logs show: `✅ Wallet credited`
5. ✅ App alert: "Payment Successful"
6. ✅ Wallet balance increased

---

## 🚀 NEXT STEPS AFTER TESTING

Once testing is complete and working:

1. **Take Backup**: Save `backend/.env` and `.env` files
2. **Document**: Keep these reference files handy
3. **Production**: To go live, just change:
   - `PHONEPE_ENV=production`
   - Update credentials to production client ID/secret
   - Restart backend

---

## ❓ STILL HAVING ISSUES?

1. **Check logs first**: Most info in console/terminal
2. **Verify IPs**: All should be `192.168.1.110`
3. **Restart services**: Stop and start both backend + frontend
4. **Check .env files**: Ensure all values are correct
5. **Database**: Verify tables exist (`phonepe_transactions`, `wallet_transactions`)

---

**Status**: ✅ Ready to Test
**Fix Deployed**: August 12, 2026
**Environment**: Sandbox (No Real Money)
**Support**: Check logs first, then reference documents
