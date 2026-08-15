# PhonePe - CLICK HERE Guide

## What You Need to Do

You're already logged into PhonePe dashboard. Now:

---

## 🎯 EXACT STEPS (Copy/Paste)

### Step 1: Find Settings

**Look at the LEFT SIDE of your screen**

You'll see menu items. Find and **CLICK**:
```
Settings (with green "New" badge)
```

The menu shows:
- Payment Links
- Settlements
- Manage Users
- Developer Settings
- Developer Documentation
- Know Your Dashboard
- Settings ⚙️ ← CLICK THIS ONE
- Test Mode
- Help

---

### Step 2: Find Webhooks

After clicking Settings, you'll see tabs/options at the top:

Look for: **"Webhooks"**

**CLICK IT**

---

### Step 3: Add Webhook

You should see a button. Click it:
```
"Add Webhook" or "New Webhook"
```

---

### Step 4: Fill the Form

**Webhook URL field:**
```
https://kushi-cabs-27p8.onrender.com/api/phonepe/callback
```

**HTTP Method:**
```
POST
```

**Events (checkbox all):**
```
☑ Payment Success
☑ Payment Failed
☑ Payment Pending
```

---

### Step 5: Save

**Click:** "Save" or "Register" button

---

### Step 6: Test

**Click:** "Test" button (if available)

Backend should show:
```
✅ Webhook test received
```

---

## ✅ DONE!

That's it! Your webhook is registered.

Now drivers can add money and wallet will auto-credit.

---

## If You Can't Find Settings

Try this alternative:

1. Click **Developer Settings** (you might already be here)
2. Look for tabs at TOP: "API Keys", "Webhooks"
3. Click **Webhooks** tab
4. Click **Add Webhook**
5. Follow Step 4 & 5 above

---

## 📋 Summary

| What | Where | Action |
|-----|-------|--------|
| Settings | Left menu, bottom | Click |
| Webhooks | Inside Settings | Click |
| Add Webhook | Inside Webhooks | Click |
| URL | Form field | Paste: `https://kushi-cabs-27p8.onrender.com/api/phonepe/callback` |
| Method | Form field | Select: POST |
| Events | Form checkboxes | Check all 3 |
| Save | Bottom of form | Click |
| Test | After save | Click (optional) |

---

## 🎉 Result

Once done:
- ✅ Webhook registered
- ✅ Real payments work
- ✅ Driver wallets auto-credit
- ✅ Done! 🚀

---

**Time to complete: 3-5 minutes**
