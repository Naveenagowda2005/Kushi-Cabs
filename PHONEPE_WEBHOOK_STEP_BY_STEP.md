# PhonePe Webhook Setup - Step by Step with Screenshots

## You Are Here: ✅ Developer Settings Page

You're on the right page! Now follow these exact steps:

---

## 📍 Step 1: Look at Left Sidebar Menu

You should see:
- Payment Links
- Settlements
- Manage Users
- **Developer Settings** ← You are here
- Developer Documentation
- Know Your Dashboard
- Settings (with "New" badge)
- Test Mode
- Help

---

## 📍 Step 2: Click "Settings" (At Bottom)

Look at the left menu and click on **Settings** (it has a green "New" badge)

---

## 📍 Step 3: Navigate to Webhooks

After clicking Settings, you should see options like:
- API Keys (where you are now)
- Webhooks ← **CLICK THIS**
- Other settings

Click on **"Webhooks"** tab/option

---

## 📍 Step 4: Add New Webhook

You should see a button that says:
- "Add Webhook" OR
- "+ New Webhook" OR
- "Configure Webhook"

**Click it**

---

## 📍 Step 5: Enter Webhook Details

A form will appear. Fill it with:

### URL Field:
```
https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

### Method:
```
POST
```

### Events (Check all):
- ✅ Payment Success
- ✅ Payment Failed  
- ✅ Payment Pending

---

## 📍 Step 6: Save/Register

Click the **"Save"** or **"Register"** button

---

## 📍 Step 7: Test Webhook (Important!)

After saving, look for a **"Test"** button

Click it to verify webhook connectivity

You should see response in backend logs:
```
📱 PhonePe Webhook Received
   Status: SUCCESS
   Code: 000
```

---

## ✅ Done!

After this, real payments will work:

```
1. Driver pays ₹100
2. PhonePe processes payment
3. Webhook sends confirmation
4. Your backend receives it
5. Wallet instantly credited ✨
```

---

## 🔍 Exact Path to Webhooks

If you can't find Settings with "New" badge:

**Alternative method:**

1. Look at left sidebar
2. Click **"Developer Settings"** (where you are now)
3. Look for **"Webhooks"** tab at the top
4. If not visible, scroll down or look for settings icon

---

## ⚠️ Common Issues

### Can't find Settings?
- Look for gear icon ⚙️ at bottom left
- OR look for "Settings" link in left menu

### Can't find Webhooks?
- Click "Settings" first
- Then look for "Webhooks" option
- May be under "Developer Settings" → "Webhooks"

### Form looks different?
- Just fill in the URL field with the callback URL
- Make sure it's POST method
- Enable all payment events

---

## 💡 The Webhook URL You Need to Add

**Copy this exactly:**
```
https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

This is where PhonePe will send payment confirmations.

---

## 🎯 After Registration

You'll see in the dashboard:
- ✅ Webhook registered
- ✅ Status: Active
- ✅ Last test: (timestamp)

---

## 📞 Can't Find It?

If you're completely lost:

1. Take screenshot of current page
2. Look for any menu item with:
   - "Webhook"
   - "Integration"
   - "Callback"
   - "Events"
   - "Settings"

3. OR contact PhonePe support:
   - https://www.phonepe.com/business/support

---

**Once registered: Real payments work immediately! 🎉**
