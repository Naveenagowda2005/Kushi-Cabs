# PhonePe Sandbox (Test Mode) - Complete Setup & Testing Guide

## Current Configuration

✅ Backend updated with PhonePe Sandbox credentials:
```
PHONEPE_MERCHANT_ID=ONESTEPCHECKOUT
PHONEPE_API_KEY=99994d42-602f-4f60-9e30-a30a1eae70ff
PHONEPE_KEY_INDEX=1
PHONEPE_ENV=sandbox
```

✅ Frontend updated to use sandbox merchant ID in deep links

✅ Backend restarted to pick up new credentials

## How Sandbox Testing Works

PhonePe Sandbox allows you to test the payment flow WITHOUT actual payments:

### Sandbox Merchant Account
- **Merchant ID**: `ONESTEPCHECKOUT` (PhonePe's public test merchant)
- **API Key**: `99994d42-602f-4f60-9e30-a30a1eae70ff` (PhonePe's public test key)
- **Environment**: `sandbox` (all API calls go to sandbox endpoints)

### Test UPI Accounts (for PhonePe Sandbox)

When PhonePe opens in test mode, you can use these test accounts:

**Test UPI IDs** (in PhonePe Sandbox):
- `test@upi` (succeeds)
- `test123@ybl` (succeeds)
- `success@okhdfcbank` (always succeeds)
- `fail@okhdfcbank` (always fails)

**PIN**: Any 4-digit PIN (e.g., `1234`)

## Payment Flow in Sandbox

### Step 1: Initiate Payment
```
Frontend → Backend POST /api/phonepe/create-order
{
  userId: "driver-id",
  amount: 100,  // ₹100
  merchantOrderId: "TXN_...",
  userType: "driver"
}
```

### Step 2: Backend Creates Order
- Saves transaction to `phonepe_transactions` table with status: `INITIATED`
- Returns transaction ID

### Step 3: Frontend Opens PhonePe Deep Link
```
phonepe://pay?amount=10000&transactionId=PP_TXN_...&merchantId=ONESTEPCHECKOUT
```

### Step 4: PhonePe App Opens (Sandbox Mode)
- Shows payment UI with test UPI accounts
- User selects test account and enters PIN
- Simulates payment processing

### Step 5: Status Polling
- Frontend polls `/api/phonepe/order-status/:orderId` every 2 seconds
- Checks if payment completed

### Step 6: Payment Result
- ✅ **SUCCESS**: Wallet credited immediately
- ❌ **FAILED**: Shows error, no wallet credit
- ⏳ **PENDING**: Continues polling

## Testing Checklist

### Setup Verification
- [ ] Backend restarted (after .env changes)
- [ ] Frontend showing updated deep link URL with `ONESTEPCHECKOUT`
- [ ] PhonePe app installed on test device/simulator

### Payment Test - SUCCESS Case
- [ ] Open app and go to Wallet
- [ ] Click "Deposit" button
- [ ] Enter amount: ₹100
- [ ] Click "Pay with PhonePe"
- [ ] PhonePe opens (no verification error)
- [ ] Select test account: `success@okhdfcbank`
- [ ] Enter PIN: `1234`
- [ ] Click Pay
- [ ] PhonePe processes payment
- [ ] Modal shows: "💳 Payment In Progress"
- [ ] After 2-10 seconds: "✅ Payment Successful"
- [ ] Wallet balance updates (was 0, now 100)
- [ ] Modal closes

### Payment Test - FAIL Case
- [ ] Open app and go to Wallet
- [ ] Click "Deposit" button
- [ ] Enter amount: ₹50
- [ ] Click "Pay with PhonePe"
- [ ] PhonePe opens
- [ ] Select test account: `fail@okhdfcbank`
- [ ] Enter PIN: `1234`
- [ ] Click Pay
- [ ] PhonePe shows failure
- [ ] Modal shows: "❌ Payment Failed"
- [ ] Wallet balance unchanged

### Logging for Debugging

Frontend logs to watch:
```
LOG  ✅ Payment order created
LOG  🔗 Attempting to open PhonePe app with deep link...
LOG  Deep Link URL: phonepe://pay?amount=10000&transactionId=...&merchantId=ONESTEPCHECKOUT
LOG  ✅ PhonePe app opened successfully
LOG  📊 Starting status polling for PP_TXN_...
LOG  📊 Poll #1: Status = INITIATED
LOG  📊 Poll #5: Status = SUCCESS
LOG  ✅ Payment successful!
```

Backend logs to watch:
```
📱 PhonePe Create Order API Call
   User: fe5d13b8-5ca7-48ca-9625-33704cd48beb
   Amount: ₹100
✅ Order Created Locally
✅ Transaction updated to SUCCESS
✅ Wallet credited for user fe5d13b8-5ca7-48ca-9625-33704cd48beb: ₹100
```

## Common Issues in Sandbox

### Issue 1: "Verification Failed" Error
**Cause**: Old merchant ID still in code or .env not restarted
**Fix**:
- [ ] Check backend logs show: `Merchant ID: ONESTEPCHECKOUT`
- [ ] Verify .env has correct merchant ID
- [ ] Restart backend after .env changes

### Issue 2: PhonePe Shows Wrong Merchant Name
**Cause**: Using production merchant ID instead of sandbox
**Fix**:
- [ ] Verify `PHONEPE_ENV=sandbox` in backend .env
- [ ] Deep link should use `ONESTEPCHECKOUT`
- [ ] Restart backend

### Issue 3: Test Accounts Not Working
**Cause**: Using production UPI accounts in sandbox
**Fix**:
- [ ] Use only sandbox test accounts listed above
- [ ] Format: `test@upi` or `fail@okhdfcbank`
- [ ] PIN can be any 4 digits

### Issue 4: Payment Never Completes (Stuck on Polling)
**Cause**: Backend not receiving webhook or status check failing
**Fix**:
- [ ] Check backend logs for: `Order Status API Call`
- [ ] Verify transaction exists in `phonepe_transactions` table
- [ ] Check console for polling error messages
- [ ] Try refreshing the app

## Moving to Production (When Ready)

To switch from sandbox to production:

1. **Get Production Credentials**:
   - Create merchant account at https://merchant.phonepe.com
   - Go to Settings → Security
   - Copy real Merchant ID and API Key

2. **Update .env**:
   ```
   PHONEPE_MERCHANT_ID=YOUR_REAL_MERCHANT_ID
   PHONEPE_API_KEY=YOUR_REAL_API_KEY
   PHONEPE_ENV=production  # Changed from sandbox
   ```

3. **Update Deep Link in Frontend**:
   ```
   merchantId=YOUR_REAL_MERCHANT_ID  # Changed from ONESTEPCHECKOUT
   ```

4. **Restart Backend**:
   ```
   npm start
   ```

5. **Register Webhook URL**:
   - Go to PhonePe Merchant Dashboard
   - Settings → Webhooks
   - Add: `https://your-backend-url/api/phonepe/callback`

6. **Test with Real Payment** (small amount like ₹1):
   - Use real UPI account
   - Verify payment processes
   - Check wallet updated

## Test Commands

### Check Transaction Status
```bash
# Backend should expose this endpoint
curl http://localhost:4000/api/phonepe/order-status/TXN_12345
```

### Manual Webhook Test (Development Only)
```bash
curl -X POST http://localhost:4000/api/phonepe/callback \
  -H "Content-Type: application/json" \
  -d '{
    "merchantOrderId": "TXN_12345",
    "state": "SUCCESS",
    "amount": 100
  }'
```

## What Gets Tested

### ✅ In Sandbox
- Deep link integration (PhonePe opens)
- Payment flow UI (modals, alerts)
- Status polling mechanism
- Wallet credit logic
- Error handling (failed payments)
- End-to-end flow

### ❌ NOT Tested in Sandbox
- Real bank connections
- Actual money transfer
- Real UPI accounts
- Production API rate limits
- Real webhook signatures

## Success Criteria

After testing, you should see:

1. ✅ PhonePe opens without "verification failed"
2. ✅ Payment simulation completes in PhonePe
3. ✅ Frontend shows "Payment In Progress" with polling
4. ✅ After payment, shows "Payment Successful"
5. ✅ Wallet balance updates correctly
6. ✅ Transaction saved in database
7. ✅ No errors in backend logs

## Next Steps

1. **Test the sandbox flow** using the checklist above
2. **Verify all logs** match expected output
3. **Document any issues** and fix them
4. **Once working**, transition to production credentials when ready

---
**Status**: ✅ Sandbox configured and ready to test  
**Date**: August 7, 2026  
**Updated Files**: backend/.env, PhonePePaymentModal.js
