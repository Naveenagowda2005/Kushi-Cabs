# Final Instructions - PhonePe Webhook Registration

## 🎯 Your Current Status

✅ Backend: Working  
✅ Frontend: Working  
✅ Database: Ready  
⏳ Webhook: NEEDS REGISTRATION (You're doing this now!)

---

## 📱 What You're Looking At

**Screenshot shows:** PhonePe Business Dashboard - Developer Settings

---

## ✅ To Enable Real Payments: 3 Simple Steps

### Step 1: Navigate to Webhooks Settings

**In your PhonePe dashboard:**

1. Look at **left sidebar**
2. Find **"Settings"** (green "New" badge)
3. Click it

---

### Step 2: Register Your Webhook URL

**In Settings page:**

1. Find **"Webhooks"** option
2. Click **"Add Webhook"** button
3. In the form, paste:
   ```
   https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
   ```

4. Set method: **POST**
5. Check all events:
   - ✅ Payment Success
   - ✅ Payment Failed
   - ✅ Payment Pending

6. Click **"Save"**

---

### Step 3: Test It

1. Click **"Test"** button
2. Your backend will receive test webhook
3. Logs will show: `✅ PhonePe Webhook Received`

---

## 🎉 That's It!

Once webhook is registered:

**Real payment flow works:**
```
1. Driver: "Add Money ₹100"
2. App: Open PhonePe payment
3. Driver: Complete UPI payment
4. PhonePe: Send webhook confirmation
5. Backend: Receive → Update database
6. Wallet: Auto-credited ₹100 ✨
```

---

## 📍 Where to Add the Webhook URL

```
https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

**This goes in:** PhonePe Dashboard → Settings → Webhooks → Add Webhook → Webhook URL field

---

## ⚡ Quick Reference

| Item | Value |
|------|-------|
| **Webhook URL** | `https://kushi-cabs-27p8.onrender.com/api/phonepe/callback` |
| **Method** | POST |
| **Events** | Payment Success, Failed, Pending |
| **Your Merchant ID** | M18UH4EERGY0 |
| **Dashboard** | https://merchant.phonepe.com/dashboard |

---

## 🔄 Payment Flow Diagram

```
┌────────────┐
│ Driver App │ "Add Money ₹100"
└─────┬──────┘
      │
      ▼
┌──────────────────┐
│  Backend Server  │ Create transaction
│                  │ Generate signature
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│  PhonePe Payment │ Process UPI payment
│  (Real device)   │ Driver completes payment
└─────┬────────────┘
      │
      ▼ (Webhook callback)
┌──────────────────┐
│  Your Backend    │ POST /api/phonepe/callback
│  Receives: "OK"  │ Update status → SUCCESS
└─────┬────────────┘
      │
      ▼ (Database trigger)
┌──────────────────┐
│  Wallet Updated  │ Auto-credit ₹100
│  Balance: +₹100  │
└──────────────────┘
```

---

## ✨ Success Indicators

After registering webhook, you should see:

**In PhonePe Dashboard:**
- ✅ Webhook shows "Active" status
- ✅ "Last tested" timestamp shows recent date

**In Your Backend Logs:**
- ✅ `📱 PhonePe Webhook Received` message
- ✅ Status: SUCCESS or PENDING

**In Supabase Database:**
- ✅ `phonepe_transactions` table has records with status = "SUCCESS"
- ✅ `wallet_transactions` table shows credit entries
- ✅ Driver's wallet balance increased

---

## 🐛 Troubleshooting

### Webhook not working?

**Check 1:** Did you copy URL exactly?
```
Correct: https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
Wrong: https://kushi-cabs-27p8.onrender.com/api/phonepe/  (missing callback)
```

**Check 2:** Is method set to POST?

**Check 3:** Are all events enabled?

**Check 4:** Did you click "Save"?

### Still issues?

1. Open backend console
2. Make test payment
3. Check logs for error messages
4. Message me the error

---

## 📚 Documentation Files

If you need more details:

- `PHONEPE_CLICK_HERE.md` - Visual step-by-step
- `PHONEPE_WEBHOOK_STEP_BY_STEP.md` - Detailed guide
- `PHONEPE_WEBHOOK_SETUP.md` - Complete technical guide
- `PHONEPE_ONE_PAGE_GUIDE.md` - Quick reference
- `PHONEPE_COMPLETE_SUMMARY.md` - Full overview

---

## ⏱️ Time to Complete

- Reading these instructions: 2 minutes
- Navigating to webhooks: 1 minute
- Adding webhook URL: 2 minutes
- Testing: 1 minute

**Total: ~5-6 minutes**

---

## 🚀 After Webhook Setup

1. **Real payments work immediately**
2. **No additional code changes needed**
3. **Users can recharge wallets**
4. **Money auto-credited**
5. **Ready for production!**

---

## 💪 You're Almost There!

Everything is ready. Just one more step:

**Register the webhook URL in PhonePe dashboard**

Then real payments will work end-to-end! 🎉

---

**Good luck! 🚀**
