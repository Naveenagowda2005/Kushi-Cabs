# PhonePe Payment Integration - Testing Guide

**Date:** August 7, 2026  
**Phase:** Phase 1 Complete, Phase 2 Ready  

---

## 🧪 Quick Start Testing

### 1. Auth Token Test (Already Working ✅)

**Command:**
```bash
curl -X POST http://192.168.1.113:4000/api/phonepe/auth-token \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "TTE4VUg0...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "timestamp": 1786118203572
  }
}
```

---

## 🔄 End-to-End Payment Test (Coming in Phase 2)

### Step 1: Frontend Payment Initiation
When driver taps "Add Money" button:
1. App calls `initiatePhonePePayment(userId, 100, 'driver')`
2. Frontend gets auth token
3. Frontend creates order
4. Returns order data to SDK

### Step 2: SDK Payment Processing
1. PhonePe SDK opens checkout screen
2. User selects payment method (UPI/Card/Net Banking)
3. User completes payment
4. SDK returns result

### Step 3: Backend Verification
1. PhonePe sends webhook callback
2. Backend verifies signature
3. Backend updates transaction status
4. Database trigger credits wallet
5. Frontend gets success notification

### Step 4: Wallet Display Update
1. Driver sees wallet balance updated
2. Money reflected in account
3. Transaction visible in history

---

## 🧪 Manual Testing Scenarios

### Scenario 1: Successful Payment Flow
1. Open driver app
2. Tap wallet/add money
3. Enter ₹100
4. Select UPI payment
5. Complete payment
6. Verify wallet credited
7. Check `phonepe_transactions` table for SUCCESS status

### Scenario 2: Failed Payment
1. Same as above but cancel payment
2. Verify transaction status = FAILED
3. Verify wallet NOT credited
4. Verify user can retry

### Scenario 3: Network Error Recovery
1. Start payment
2. Disconnect network mid-flow
3. App should handle gracefully
4. Verify retry logic works

### Scenario 4: Duplicate Payment Prevention
1. Complete payment
2. Webhook arrives twice
3. Verify wallet credited only once (idempotent)

---

## 📊 Database Testing

### Check Transactions Table
```sql
SELECT * FROM phonepe_transactions 
ORDER BY created_at DESC LIMIT 10;
```

**Expected Columns:**
- id (UUID)
- user_id (who paid)
- amount (in rupees)
- status (INITIATED/SUCCESS/FAILED)
- merchant_transaction_id (our tracking ID)
- phonepe_transaction_id (PhonePe's ID)
- created_at, verified_at

### Check Webhook Logs
```sql
SELECT * FROM phonepe_webhook_logs 
ORDER BY received_at DESC LIMIT 10;
```

**Expected Data:**
- transaction_id
- status (from webhook)
- code (response code)
- payload (full webhook body)

### Verify Wallet Credit
```sql
SELECT * FROM wallet_transactions 
WHERE user_id = 'fe5d13b8-5ca7-48ca-9625-33704cd48beb'
AND type = 'credit'
ORDER BY created_at DESC LIMIT 5;
```

---

## 🐛 Debugging Tips

### Check Backend Logs
```bash
# Terminal running backend
npm start
# Look for 📱 PhonePe Request logs
```

### Check Frontend Logs
```bash
# Expo logs in terminal
# Look for 💳 Initiating PhonePe payment logs
```

### Enable Verbose Logging
Add to backend/routes/phonepe-payment.js:
```javascript
console.log('Full request body:', req.body);
console.log('Full response:', response.data);
```

### Verify Auth Token Works
```bash
# Test token endpoint multiple times
curl -X POST http://192.168.1.113:4000/api/phonepe/auth-token
# Token should be cached on second call
```

---

## 📱 PhonePe Sandbox Testing

### Sandbox Credentials (Already Configured)
- Merchant ID: M18UH4EERGY0
- API Key: ba33ba9c-a4fc-4bea-bf2b-ble1f7c05fac
- Environment: sandbox (via PHONEPE_ENV=sandbox)

### Sandbox API Endpoints
- Auth: https://api-preprod.phonepe.com/apis/identity-manager/v1/oauth/token
- Orders: https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/sdk/order
- Status: https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/{orderId}/status

### Test Card Numbers (if PhonePe provides)
Ask PhonePe for sandbox test card numbers or use their test UPI ID.

---

## ✅ Success Criteria

### Auth Token Test
- [ ] Endpoint returns 200 OK
- [ ] accessToken present in response
- [ ] expiresIn is 3600 seconds
- [ ] No errors in logs

### Create Order Test (Phase 2)
- [ ] Endpoint returns 200 OK
- [ ] Order ID generated
- [ ] User verified in database
- [ ] Transaction saved to DB

### Status Check Test (Phase 2)
- [ ] Returns 200 OK
- [ ] Status matches PhonePe response
- [ ] Database updated
- [ ] No errors

### Webhook Test (Phase 2)
- [ ] Receives callback from PhonePe
- [ ] Signature verified
- [ ] Status updated in DB
- [ ] Wallet credited if SUCCESS
- [ ] Transaction logged

### UI Test (Phase 2)
- [ ] Payment button works
- [ ] Modal opens without errors
- [ ] Amount validation works
- [ ] Success message appears
- [ ] Wallet balance updates
- [ ] Transaction appears in history

---

## 🔧 Troubleshooting

### Issue: "TOKEN_NOT_FOUND"
**Solution:** Token endpoint not responding
- Check backend is running: `npm start` in backend folder
- Check logs for errors
- Verify port 4000 is accessible

### Issue: "ORDER_CREATION_FAILED"
**Solution:** User not found or amount invalid
- Verify user exists in database
- Check amount is > 0
- Check amount < 100000

### Issue: "Wallet not credited"
**Solution:** Trigger not firing or RLS blocking
- Check trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname LIKE '%phonepe%'`
- Check RLS policies
- Verify webhook was received

### Issue: "Payment not appearing in history"
**Solution:** Transaction not saved
- Check `phonepe_transactions` table
- Verify payment status is SUCCESS
- Check database insert permissions

---

## 📋 Manual Test Checklist

### Pre-Test Setup
- [ ] Backend running: `npm start` in backend/
- [ ] Frontend running: `npm start` in newtaxi/apps/unified/
- [ ] Supabase connected
- [ ] Tables created (check migration 113)
- [ ] Environment variables set

### Test Execution
- [ ] Auth token endpoint working
- [ ] No errors in backend logs
- [ ] No errors in frontend logs
- [ ] No network timeouts
- [ ] Proper error messages for failures

### Post-Test Verification
- [ ] Check `phonepe_transactions` table
- [ ] Check `phonepe_webhook_logs` table
- [ ] Check `wallet_transactions` table
- [ ] Check user's `wallets` table
- [ ] Verify balance updated correctly

---

## 🚀 When Ready for Phase 2

You'll need to:
1. ✅ Complete this Phase 1 testing (auth token working)
2. ⏳ Update PhonePePaymentModal.js to use OAuth flow
3. ⏳ Test end-to-end payment initiation
4. ⏳ Verify webhook receipt
5. ⏳ Confirm wallet credit works
6. ⏳ Test error scenarios

---

## 📞 Need Help?

**Check these files:**
- `backend/routes/phonepe-payment.js` - OAuth endpoints
- `newtaxi/apps/unified/src/services/paymentService.js` - Frontend service
- `PHONEPE_ACTION_PLAN.md` - Full implementation plan
- `PHONEPE_PHASE_1_STATUS.md` - Current status

**Look at these logs:**
- Backend console (npm start output)
- Frontend Expo logs
- Database query logs

---

## 🎯 Summary

**Phase 1:** Auth tokens working ✅  
**Phase 2:** Ready to test end-to-end payments 📝  
**Phase 3:** Ready for native SDK integration 📝  

All backend endpoints are ready. Next step: Frontend integration testing.

Good luck! 🚀
