# WHERE TO ADD THE WEBHOOK - Visual Guide

## 🎯 You're Looking at PhonePe Dashboard

I can see your screenshot. Here's exactly what to do:

---

## 📍 STEP 1: Click "Settings" in Left Menu

**Look at the left sidebar (where you see):**
```
Payment Links
Settlements
Manage Users
Developer Settings ← You might be here
Developer Documentation
Know Your Dashboard
Settings ⚙️ ← CLICK THIS
Test Mode
Help
```

**ACTION:** Click on **"Settings"** (the one with green "New" badge at bottom)

---

## 📍 STEP 2: Look for Webhooks Tab

**After clicking Settings, you should see at the TOP:**
```
API Keys [selected]
Webhooks [click this]
```

**ACTION:** Click on **"Webhooks"** tab

---

## 📍 STEP 3: Click "Add Webhook" Button

**After going to Webhooks, you should see:**
```
┌─────────────────────────┐
│  Add Webhook  [Button]  │  ← CLICK THIS
└─────────────────────────┘

Your Webhooks:
(empty or list)
```

**ACTION:** Click the **"Add Webhook"** button

---

## 📍 STEP 4: Fill the Form

**A form will appear with fields:**

### Field 1: Webhook URL
```
┌──────────────────────────────────────────────┐
│ Webhook URL:                                 │
│ ┌────────────────────────────────────────┐  │
│ │ https://kushi-cabs-27p8.onrender.com   │  │
│ │ /api/phonepe/callback                  │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Copy & Paste this EXACTLY:**
```
https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

### Field 2: HTTP Method
```
┌──────────────────┐
│ Method:   POST   │  ← Select POST
└──────────────────┘
```

**ACTION:** Select **"POST"**

### Field 3: Events
```
☑ Payment Success      ← CHECK
☑ Payment Failed       ← CHECK
☑ Payment Pending      ← CHECK
```

**ACTION:** Check all 3 checkboxes

---

## 📍 STEP 5: Save

**At the bottom of the form:**
```
┌──────────────┐  ┌─────────┐
│   Cancel     │  │  Save   │ ← CLICK THIS
└──────────────┘  └─────────┘
```

**ACTION:** Click **"Save"** button

---

## 📍 STEP 6: Test (Optional but Recommended)

**After saving, you should see:**
```
Your Webhooks:
✓ https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
  Status: Active
  [Test] [Edit] [Delete]
```

**ACTION:** Click **"Test"** button

**Expected result in backend logs:**
```
📱 PhonePe Webhook Received
   Status: SUCCESS
   Code: 000
```

---

## ✅ DONE!

After these steps:
- ✅ Webhook registered
- ✅ Real payments work
- ✅ Wallet auto-credits
- ✅ Ready to go! 🚀

---

## 📋 What You're Adding

**THIS URL:**
```
https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

**GOES HERE:**
```
PhonePe Dashboard → Settings → Webhooks → Add Webhook → URL Field
```

**WHAT IT DOES:**
When customer pays, PhonePe sends confirmation to this URL → Your backend updates database → Wallet credited

---

## 🔗 Quick Links

| Item | Link/Action |
|------|-------------|
| PhonePe Dashboard | https://merchant.phonepe.com/dashboard |
| Webhook URL to add | `https://kushi-cabs-27p8.onrender.com/api/phonepe/callback` |
| Method | POST |
| Events | All 3 (Success, Failed, Pending) |

---

## ⚠️ Common Mistakes

❌ **WRONG:**
- Adding incomplete URL: `https://kushi-cabs-27p8.onrender.com/api/` (missing `/phonepe/callback`)
- Using GET instead of POST
- Only checking some events

✅ **RIGHT:**
- Full URL: `https://kushi-cabs-27p8.onrender.com/api/phonepe/callback`
- Method: POST
- All 3 events checked

---

## 💡 If You Can't Find Settings

**Alternative path:**
1. Click **"Developer Settings"** in left menu
2. Look for **"Webhooks"** link/tab
3. Click it
4. Click **"Add Webhook"**
5. Follow Step 4 & 5 above

---

## 📸 Visual Summary

```
Current State:
  Your browser → PhonePe Dashboard → Developer Settings ✅

Next:
  Click: Settings in left menu
    ↓
  Click: Webhooks tab
    ↓
  Click: Add Webhook button
    ↓
  Paste: https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
    ↓
  Select: POST
    ↓
  Check: All 3 events
    ↓
  Click: Save
    ↓
  Done! ✅
```

---

## 🎯 Your Task

1. Click Settings (left menu)
2. Click Webhooks
3. Click Add Webhook
4. Paste the URL above
5. Select POST
6. Check all events
7. Click Save

**That's it!** 🎉

---

**Time needed: 5 minutes max**

**Result: Real PhonePe payments working! ✨**
