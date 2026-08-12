# PhonePe Phase 2 - End-to-End Testing Guide

**Status:** Phase 2 Complete ✅  
**Date:** August 7, 2026  
**Components Updated:** PhonePePaymentModal.js  

---

## 🎯 What's New in Phase 2

### PhonePePaymentModal.js Updates

✅ **Real Payment Flow:**
- OAuth token retrieval from backend
- Order creation via `/api/phonepe/create-order`
- Status polling every 2 seconds
- Auto-wallet credit on success

✅ **Payment Status Display:**
- Shows real-time status while processing
- Poll count displayed
- Automatic transitions: INITIATED → PENDING → SUCCESS/FAILED

✅ **Error Handling:**
- Network error recovery
- Graceful state management
- User-friendly error messages

✅ **UI Improvements:**
- Status box shows payment state
- Hides payment form during processing
- Clear success/failure messages
- Proper button state management

---

## 🧪 Testing Procedures

### Pre-Test Checklist

- [ ] Backend running: `npm start` in `backend/`
- [ ] Frontend running: `npm start` in `newtaxi/apps/unified/`
- [ ] Both servers healthy (no errors in logs)
- [ ] Database migrations applied (Migration 113)
- [ ] `.env` files configured correctly

### Test Case 1: Successful Payment Flow

**Scenario:** User adds ₹100 to wallet

**Steps:**

1. **Open Driver App**
   - Navigate to wallet section
   - Current balance should display correctly

2. **Tap "Add Money" Button**
   - PhonePePaymentModal should appear
   - Balance displayed at top

3. **Enter Amount**
   - Tap ₹100 quick amount button
   - Amount should be highlighted

4. **Initiate Payment**
   - Tap "Pay ₹100" button
   - Should see: "Initiating payment..." in alert
   - Alert should show Transaction ID

5. **Tap OK on Alert**
   - Modal should show status box: "Checking payment status..."
   - Poll count should increment every 2 seconds
   - Form should hide, only status visible

6. **Check Backend Logs**
   - Look for: `📱 PhonePe Request: POST /auth-token`
   - Look for: `📱 PhonePe Request: POST /create-order`
   - Look for: `📱 PhonePe Request: GET /order-status`

7. **Monitor Database**
   - Query: `SELECT * FROM phonepe_transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;`
   - Should see status: `INITIATED` initially
   - Status should update to `SUCCESS` when payment completes

8. **Wait for Success**
   - After webhook processes, should see: "✅ Payment Successful"
   - Alert confirms amount and wallet credited
   - Tapping OK closes modal

9. **Verify Wallet Updated**
   - Previous balance: ₹500 (example)
   - New balance: ₹600
   - Transaction appears in history

---

### Test Case 2: Failed Payment

**Scenario:** Payment is declined or times out

**Steps:**

1. Same as Test Case 1, steps 1-5
2. After 3+ polls (6+ seconds), if no success:
   - Backend returns `state: 'FAILED'`
   - Modal shows: "❌ Payment failed"
   - Alert: "Your payment was declined. Please try again."
   - Tapping "Try Again" closes modal
   - Wallet balance unchanged

**Verification:**
- Database shows status: `FAILED`
- Wallet NOT credited
- User can retry immediately

---

### Test Case 3: Network Error Recovery

**Scenario:** Network drops during payment

**Steps:**

1. Start payment flow (Test Case 1, steps 1-4)
2. After OK is tapped:
   - Disconnect network (disable WiFi/mobile data)
   - Modal shows status box
   - Polling continues but fails silently
3. Reconnect network
   - Next poll should succeed
   - Status updates properly
4. Payment completes normally

**Verification:**
- No app crash
- Proper error logging in console
- Recovery automatic once network restored

---

### Test Case 4: Duplicate Payment Prevention

**Scenario:** Webhook arrives twice for same payment

**Steps:**

1. Complete successful payment (Test Case 1)
2. Manually trigger webhook twice:
   ```bash
   curl -X POST http://192.168.1.113:4000/api/phonepe/callback \
     -H "Content-Type: application/json" \
     -d '{
       "merchantOrderId": "TXN_USER_TIMESTAMP_RANDOM",
       "transactionId": "PHONEPE_TXN_ID",
       "state": "COMPLETED",
       "amount": 10000,
       "responseCode": "0"
     }'
   ```

**Verification:**
- First webhook: Wallet credited
- Second webhook: Wallet NOT double-credited (idempotent)
- Database shows one transaction with state: SUCCESS
- One wallet entry for the transaction

---

## 📊 Database Verification Queries

### Check Recent Transactions
```sql
SELECT 
  id,
  user_id,
  amount,
  status,
  merchant_transaction_id,
  phonepe_transaction_id,
  created_at,
  verified_at
FROM phonepe_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Webhook Logs
```sql
SELECT 
  transaction_id,
  status,
  code,
  received_at
FROM phonepe_webhook_logs 
ORDER BY received_at DESC 
LIMIT 10;
```

### Check Wallet Credits
```sql
SELECT 
  id,
  user_id,
  type,
  amount,
  description,
  created_at
FROM wallet_transactions 
WHERE type = 'credit'
ORDER BY created_at DESC 
LIMIT 10;
```

### Check User Wallet Balance
```sql
SELECT 
  user_id,
  total_balance,
  available_balance,
  last_updated
FROM wallets 
WHERE user_id = 'fe5d13b8-5ca7-48ca-9625-33704cd48beb';
```

---

## 🔍 Debugging Tips

### Check Status Polling in Logs
Look for patterns like:
```
📊 Poll #1: Status = INITIATED
📊 Poll #2: Status = PENDING
📊 Poll #3: Status = SUCCESS
✅ Payment successful!
```

### Check for Errors
```
❌ Auth Token Error
❌ Order creation failed
❌ Verification error
❌ Wallet credit failed
```

### Enable Verbose Logging
Add to `PhonePePaymentModal.js`:
```javascript
console.log('Payment Status:', paymentStatus);
console.log('Poll Count:', pollCount);
console.log('Transaction ID:', lastTransactionId);
```

### Check Backend Health
```bash
curl http://192.168.1.113:4000/health
# Should return: {"status": "ok"}
```

---

## ⚙️ Configuration Reference

### Payment Flow Timings
- Poll interval: 2 seconds
- Max poll time: ~60 seconds (30 polls max)
- After 30 polls, assume payment stalled
- User can retry

### Test Amounts
- Minimum: ₹1
- Maximum: ₹100,000
- Test values: 100, 250, 500, 1000, 2000, 5000

### Environment
- Backend: http://192.168.1.113:4000
- Frontend: Expo (local device/simulator)
- Database: Supabase
- Webhooks: Routed through backend

---

## ✅ Success Criteria

### Phase 2 Completion Checklist

- [ ] Auth token endpoint returns 200 OK
- [ ] Order creation endpoint works
- [ ] Status polling fires every 2 seconds
- [ ] Status updates in modal in real-time
- [ ] Payment success detected automatically
- [ ] Wallet credited on success
- [ ] Failed payments don't credit wallet
- [ ] No duplicate credits from duplicate webhooks
- [ ] Network errors handled gracefully
- [ ] UI responsive during processing
- [ ] All console logs clean
- [ ] No TypeScript/compilation errors

### What to Check

1. **Backend Console**
   - No 500 errors
   - Proper request logging
   - Webhook received and processed

2. **Frontend Console**
   - No crashes
   - Status updates logged
   - Polling visible in logs

3. **Database**
   - Transaction created and updated
   - Wallet entry created
   - Status transitions correct

4. **User Experience**
   - Modal works smoothly
   - Status visible to user
   - Success/failure clear
   - Wallet updates immediately

---

## 🚀 Testing Flow Diagram

```
User Opens Modal
    ↓
Enters Amount (₹100)
    ↓
Taps "Pay" Button
    ↓
Alert shows Transaction ID
    ↓
User taps "OK"
    ↓
Backend: POST /auth-token ✅
    ↓
Backend: POST /create-order ✅
    ↓
Modal shows "Checking status..."
    ↓
Poll #1: Backend: GET /order-status
    ↓
Poll #2: GET /order-status
    ↓
...polls every 2 seconds...
    ↓
[Webhook arrives from PhonePe]
    ↓
Backend: POST /callback
    ↓
Backend updates status to SUCCESS
    ↓
Backend credits wallet
    ↓
Poll #N: GET /order-status returns SUCCESS
    ↓
Modal shows "✅ Payment Successful"
    ↓
User taps OK
    ↓
Modal closes
    ↓
Wallet balance updated on screen
```

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________
Environment: [Sandbox/Production]

Test Case 1: Successful Payment
- Amount Entered: ₹____
- Backend Response: ✓/✗
- Polling Worked: ✓/✗
- Wallet Credited: ✓/✗
- Notes: _________________________

Test Case 2: Failed Payment
- Payment Declined: ✓/✗
- Error Shown to User: ✓/✗
- Wallet NOT Credited: ✓/✗
- Notes: _________________________

Test Case 3: Network Error
- Network Dropped: ✓/✗
- Recovered After Reconnect: ✓/✗
- No App Crash: ✓/✗
- Notes: _________________________

Test Case 4: Duplicate Prevention
- Webhook Sent Twice: ✓/✗
- Single Credit Only: ✓/✗
- Database Correct: ✓/✗
- Notes: _________________________

Overall Status: PASS / FAIL / PARTIAL
```

---

## 🎯 Next: Phase 3

**When Phase 2 is complete:**
1. Android SDK integration
2. Native payment module
3. Production testing

**Start Phase 3 when:**
- [ ] All Phase 2 tests passing
- [ ] Real PhonePe payments working
- [ ] Zero errors in logs
- [ ] Database clean and consistent

---

## 📞 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Token not found" | Restart backend |
| "Order creation failed" | Check user exists |
| Wallet not credited | Check RLS policies |
| Polling not starting | Check browser console |
| Modal doesn't close | Check error in logs |
| Duplicate credits | Ensure trigger is working |

---

## 📊 Metrics to Track

- **Response Time:** Auth token < 500ms
- **Poll Success Rate:** 99%+
- **Webhook Receipt Time:** < 2 seconds
- **Wallet Credit Time:** < 5 seconds
- **Error Recovery:** 100%

---

**Phase 2 Complete!** 🎉

After testing above, move to Phase 3 for native SDK integration.

For questions: Check backend logs and database queries.
