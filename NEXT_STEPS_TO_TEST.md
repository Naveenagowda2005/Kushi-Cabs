# Next Steps - Testing the PhonePe Fix

## 🎯 Immediate Action Items

### ✅ Step 1: Install Dependencies (Do This First)
```bash
cd newtaxi/apps/unified
npm install
```

**What this does:**
- Installs `expo-linking` package
- Updates all dependencies
- Prepares the app for bundling

**Expected output:**
```
added 1 package, and audited X packages in Y seconds
```

---

### ✅ Step 2: Clear Expo Cache & Start App
```bash
expo start -c
```

Or with newer Expo CLI:
```bash
expo start --clear
```

**What this does:**
- Clears bundler cache
- Rebuilds the app bundle
- Removes any stale files

**Expected output:**
```
Starting Metro Bundler
✓ Bundled successfully
✓ Minified 12 MB of assets
```

---

### ✅ Step 3: Open App on Device

#### Option A: Android Device/Emulator
```bash
# When you see the prompt, press: a
```
Then:
1. Open app
2. Login as driver
3. Go to **Wallet** screen
4. Click **"Add Funds"** button

#### Option B: iOS Simulator
```bash
# When you see the prompt, press: i
```
Then:
1. Open app
2. Login as driver
3. Go to **Wallet** screen
4. Click **"Add Funds"** button

---

## 🧪 Testing Scenarios

### Scenario 1: Android with PhonePe Installed ✅

**Steps:**
1. Click "Add Funds"
2. PhonePePaymentModal should open
3. Select amount (e.g., ₹100)
4. Click "Pay ₹100"
5. PhonePe app should open automatically
6. Complete payment in PhonePe
7. Return to app
8. Wait 2-4 seconds for status update
9. See "✅ Payment Successful" alert

**What to look for in console:**
```
💳 Initiating payment for ₹100
✅ Order created successfully
   Order ID: TXN_xxx_1234567890_123
🔗 Attempting to open PhonePe app...
✅ PhonePe app detected, opening...
📊 Starting status polling for TXN_xxx_1234567890_123
📊 Poll #1: Status = INITIATED
📊 Poll #2: Status = PENDING
📊 Poll #N: Status = SUCCESS
✅ Payment successful!
```

---

### Scenario 2: Android without PhonePe Installed ⚠️

**Steps:**
1. Click "Add Funds"
2. Select ₹100
3. Click "Pay"
4. Alert appears: "📱 PhonePe Not Installed"
5. Can click "Open Play Store" to install
6. Click "Cancel" to close

**What to look for in console:**
```
🔗 Attempting to open PhonePe app...
⚠️  PhonePe app not installed
```

---

### Scenario 3: iOS (Any Device) ℹ️

**Steps:**
1. Click "Add Funds"
2. Select ₹100
3. Click "Pay"
4. Alert appears: "📱 iOS Limitation"
5. Message: "PhonePe payment is not yet available on iOS..."
6. Click "OK" to dismiss

**What to look for in console:**
```
🔗 Attempting to open PhonePe app...
⚠️  PhonePe deep linking not available on iOS
```

---

## ✅ Success Indicators

After running through the test scenarios, you should see:

### ✅ All Scenarios Should:
- [ ] App opens without errors
- [ ] PhonePePaymentModal component opens
- [ ] Amount selection works
- [ ] No console errors
- [ ] Proper alerts/messages display

### ✅ Android Scenario:
- [ ] PhonePe app opens or install prompt appears
- [ ] Payment status updates in real-time
- [ ] Success message appears
- [ ] Wallet balance updates (if payment succeeds)

### ✅ iOS Scenario:
- [ ] Graceful message appears (not crash)
- [ ] User can dismiss message
- [ ] App stays responsive

---

## 🔍 What to Check

### 1. Console Logs
Look for payment flow messages in Expo console:
```
✓ No red errors
✓ PhonePe-related messages appear
✓ Polling messages show
✓ Success or failure message appears
```

### 2. Network Tab (if using Expo dev tools)
Check API calls:
```
POST /api/phonepe/create-order → 200 OK
GET  /api/phonepe/order-status/{id} → 200 OK (multiple times)
```

### 3. Wallet Balance
Check after successful payment:
```
Before: ₹2000
After:  ₹2100 (if ₹100 paid)
```

### 4. Transaction History
New transaction should appear:
```
✓ Type: Credit
✓ Amount: ₹100 (or your test amount)
✓ Status: SUCCESS
✓ Method: PhonePe
```

---

## 🆘 If Something Goes Wrong

### Issue: Still seeing "Unable to resolve expo-linking"
**Fix:**
```bash
# Clear everything and reinstall
cd newtaxi/apps/unified
rm -rf node_modules
npm install
expo start -c
```

### Issue: PhonePe app won't open on Android
**Check:**
1. Is PhonePe installed on your device?
2. Try uninstalling/reinstalling PhonePe
3. Check SMS_API_URL environment variable
4. Look at backend logs for errors

### Issue: App crashes on iOS
**Fix:**
```bash
expo start -c
# Clear Xcode cache if using real device
expo run:ios
```

### Issue: Wallet not updating after payment
**Check:**
1. Check backend console for webhook logs
2. Verify phonepe_transactions table has the order
3. Check wallet_transactions table for credit entry
4. Ensure user permissions allow wallet updates

---

## 📞 Debug Information to Collect

If you need help, have ready:

1. **Console output** - Full Expo console log
2. **Error messages** - Any alert boxes you see
3. **Device info** - Android/iOS, version, PhonePe installed?
4. **Network info** - Backend URL, is it accessible?
5. **Test details** - What amount, what phone, what user account?

---

## 🎬 Recording a Test (Optional but Helpful)

To record your test for reference:

**Android:**
```bash
# Using Android Studio
adb shell screenrecord /sdcard/test.mp4
# Then pull the file when done
adb pull /sdcard/test.mp4
```

**iOS:**
```
Xcode → Product → Perform Action → Record Without Building
```

---

## ⏱️ Expected Test Duration

| Task | Time |
|------|------|
| npm install | 2-3 min |
| expo start -c | 1-2 min |
| App startup | 30-60 sec |
| Android test | 3-5 min |
| iOS test | 2-3 min |
| **Total** | **8-15 min** |

---

## 📋 Test Checklist

### Before Testing
- [ ] npm install completed
- [ ] No errors during install
- [ ] expo start -c finished
- [ ] App loads without errors
- [ ] Can login as driver
- [ ] Can navigate to Wallet

### During Android Test
- [ ] "Add Funds" button visible
- [ ] PhonePePaymentModal opens
- [ ] Can select amounts
- [ ] "Pay" button clickable
- [ ] PhonePe app opens (or install prompt)
- [ ] Console shows payment logs
- [ ] Return to app after payment
- [ ] Status updates appear
- [ ] Success message shows
- [ ] Wallet balance updates

### During iOS Test
- [ ] "Add Funds" button visible
- [ ] PhonePePaymentModal opens
- [ ] Can select amounts
- [ ] "Pay" button clickable
- [ ] iOS limitation message appears
- [ ] Can dismiss message
- [ ] App remains responsive
- [ ] No crashes or errors

---

## 🎉 Final Checklist

Once all tests pass, mark complete:

- [ ] ✅ Installed expo-linking dependency
- [ ] ✅ App bundles without errors
- [ ] ✅ PhonePePaymentModal opens on demand
- [ ] ✅ Android payment flow works
- [ ] ✅ iOS shows graceful message
- [ ] ✅ Wallet updates after payment
- [ ] ✅ Transaction history updated
- [ ] ✅ Console logs show correct flow
- [ ] ✅ No unhandled errors

---

**Ready to test?**

```bash
cd newtaxi/apps/unified
npm install
expo start -c
```

Then follow testing scenarios above! 🚀

---

**Last Updated:** August 7, 2026
**Status:** Ready for Testing ✅
