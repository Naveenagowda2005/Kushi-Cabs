# PhonePe Webhook Setup Guide

## 🎯 Current Status

✅ **Backend**: Payment initiation working  
✅ **Frontend**: Payment UI ready  
✅ **Database**: Tables created  
⏳ **Webhooks**: NEEDS SETUP  

---

## 📱 What Happens Without Webhook Setup

**Current Flow:**
```
1. Driver clicks "Add Money"
2. Enters amount (₹100)
3. Clicks "Pay"
4. ✅ Backend creates transaction record
5. ✅ Transaction ID generated
6. ⏳ WAITING: PhonePe payment would open (in production)
7. ❌ No webhook callback = Transaction stays INITIATED
8. ❌ Wallet NOT credited automatically
```

**What's Missing:**
- PhonePe needs a way to tell your backend: "Payment successful!"
- This happens via Webhook (a callback URL)
- Without it, system doesn't know if payment succeeded

---

## ✅ To Enable Real PhonePe Payments

### Step 1: PhonePe Merchant Dashboard

1. Log in to **PhonePe Merchant Dashboard**
   - URL: https://merchant.phonepe.com/dashboard
   - Merchant ID: `M18UH4EERGY0`
   - Password: (use your credentials)

2. Navigate to **Settings**

3. Find **Webhooks** section

4. Click **Add Webhook** or **Configure Webhook**

### Step 2: Register Your Webhook URL

**Webhook URL:**
```
https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

**Method:** POST

**Content-Type:** application/json

**Events to Enable:**
- ✅ Payment Success
- ✅ Payment Failed
- ✅ Payment Pending

### Step 3: Test Webhook

1. PhonePe dashboard has a **"Test Webhook"** button
2. Click it to verify connectivity
3. You should see response in backend logs:
   ```
   📱 PhonePe Webhook Received
   ```

### Step 4: Verify Setup

Check these in Supabase:

**Table:** `phonepe_webhook_logs`
```sql
SELECT * FROM phonepe_webhook_logs ORDER BY received_at DESC;
```

Should see webhook test entries.

---

## 🔄 Full Payment Flow (After Webhook Setup)

```
1. Driver: "Add Money" → ₹100
2. App: POST /api/phonepe/initiate
   ✅ Create transaction (status=INITIATED)
   ✅ Generate signature
   ✅ Return payload
3. App: Open PhonePe payment UI
4. Driver: Complete UPI payment in PhonePe app
5. PhonePe: POST /api/phonepe/callback
   ✅ Receive webhook notification
   ✅ Update transaction (status=SUCCESS)
   ✅ Credit wallet via trigger
6. App: Poll /api/phonepe/status
   ✅ See status=SUCCESS
   ✅ Show confirmation
7. Driver: Wallet updated! ₹100 added ✨
```

---

## 🧪 Testing Payments

### Sandbox Testing (Before Production)

PhonePe provides **Sandbox environment** for testing:

1. Use different merchant credentials (sandbox)
2. Payments don't really go through
3. Test the full flow without risk

**Switch to Sandbox:**
- Update backend `phonepe-payment.js`:
  ```javascript
  API_URL: 'https://sandbox-api.phonepe.com/apis/hermes'
  ```
- Test payments
- Switch back to production when ready

### Production Testing

1. Register production webhook
2. Make test payment with real UPI app
3. Verify in database:
   - Transaction created ✅
   - Webhook received ✅
   - Wallet credited ✅

---

## 🔒 Security Considerations

### Signature Verification

Backend verifies webhook signature:
```
Expected: SHA256(base64(body) + "/pg/v1/pay" + saltKey) + "###1"
Received: X-Verify-Checkout header from PhonePe
Match: ✅ Process webhook
No Match: ❌ Reject webhook
```

### Webhook Validation

Backend checks:
1. Signature is valid ✅
2. Transaction exists ✅
3. Amount matches ✅
4. Status transition valid ✅

---

## 📊 Monitoring Webhooks

### View Webhook Logs

```sql
-- See all webhooks received
SELECT 
  transaction_id,
  status,
  code,
  received_at
FROM phonepe_webhook_logs
ORDER BY received_at DESC
LIMIT 20;
```

### View Payment Status

```sql
-- See all payment transactions
SELECT 
  id,
  user_id,
  amount,
  status,
  merchant_transaction_id,
  created_at,
  verified_at
FROM phonepe_transactions
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Webhook Not Received

**Check:**
- [ ] Webhook URL correct in PhonePe dashboard
- [ ] Backend accessible from internet (check firewall)
- [ ] Backend logs show incoming POST requests
- [ ] Use PhonePe test tool to verify connectivity

**Solution:**
```bash
# Test webhook manually
curl -X POST https://kushi-cabs-27p8.onrender.com/api/phonepe/callback \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"test","status":"SUCCESS","code":"000"}'
```

### Wallet Not Credited

**Check:**
```sql
-- Was webhook received?
SELECT * FROM phonepe_webhook_logs 
WHERE status = 'SUCCESS';

-- Was transaction updated?
SELECT * FROM phonepe_transactions 
WHERE status = 'SUCCESS';

-- Was wallet transaction created?
SELECT * FROM wallet_transactions 
WHERE payment_gateway = 'phonepe';
```

### Payment Status Stuck at INITIATED

- Webhook not configured
- Webhook URL incorrect
- Signature verification failed
- Check backend logs for error details

---

## 📞 PhonePe Support

- **Dashboard**: https://merchant.phonepe.com/dashboard
- **Documentation**: https://www.phonepe.com/business/support
- **Status**: https://status.phonepe.com

---

## ✨ After Webhook Setup Complete

Once webhook is registered and tested:

1. **Real payments work end-to-end**
   - Driver adds money
   - PhonePe processes payment
   - Webhook confirms success
   - Wallet instantly credited

2. **Automatic wallet updates**
   - Trigger automatically credits wallet
   - No manual intervention needed
   - Real-time balance updates

3. **Production ready**
   - Deploy to app stores
   - Users can recharge wallets
   - Payments process automatically

---

## Checklist

- [ ] PhonePe Merchant Dashboard access working
- [ ] Webhook URL registered in PhonePe settings
- [ ] Webhook test successful
- [ ] Backend logs show incoming webhooks
- [ ] Transaction status updates to SUCCESS
- [ ] Wallet balance updated automatically
- [ ] Test payment end-to-end
- [ ] Production deployment ready

---

**Current Status:** ⏳ Waiting for webhook registration

**Next Step:** Log into PhonePe Merchant Dashboard and register webhook

**Time to Complete:** 5-10 minutes

---

Generated: August 7, 2026
