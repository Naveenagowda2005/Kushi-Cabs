# Dummy Vendor Creation - Quick Start Guide 🚀

## For Super Admins Only

### Step 1: Open Settings
1. Log in as Super Admin
2. Navigate to **Settings** screen
3. Scroll down to find **"Emergency Dummy Vendors"** section (blue card)

### Step 2: Create Vendor
1. Click the **blue (+)** button to expand the form
2. Enter a **10-digit phone number** (required)
3. Enter a **company name** (optional - will auto-generate if empty)
4. Click **"Create Dummy Vendor"** button
5. Wait for success alert

### Step 3: Use Vendor
- The dummy vendor appears in the list below
- Vendor can log in with the phone number provided
- OTP verification works normally
- Can accept trips immediately (no document verification needed)

---

## Example Scenarios

### Scenario 1: Create with Custom Name
```
Phone: 9876543210
Company: DUMMY Apex Cabs
Result: Vendor named "DUMMY Apex Cabs" ready to use
```

### Scenario 2: Create with Auto-Generated Name
```
Phone: 9876543210
Company: (leave empty)
Result: Vendor named "DUMMY Vendor 3210" ready to use
```

### Scenario 3: Reuse Phone Number
```
First Create:  9876543210 → "DUMMY Test Co"
Second Create: 9876543210 → "DUMMY New Co"
Result: Same auth account, company name updated, password reset
```

---

## Database Marker

All dummy vendors have company names starting with **"DUMMY"**, making them easy to identify:
```sql
-- Find all dummy vendors
SELECT * FROM vendors WHERE company_name ILIKE 'DUMMY%';
```

---

## Features ✅

- **⚡ Instant Creation** - Vendor ready in seconds
- **📱 Phone Only** - No complex verification needed
- **✔️ Auto-Approved** - No waiting period
- **🔄 Reusable Phone** - Use same phone again to reset
- **📋 Real-time List** - See all dummy vendors in Settings
- **🎨 Easy to Spot** - Blue card theme, "DUMMY" prefix in names

---

## What Gets Created Automatically

When you create a dummy vendor, this happens behind the scenes:

1. ✅ **Auth Account** - Can log in with phone
2. ✅ **User Record** - Vendor role assigned
3. ✅ **Vendor Record** - Company profile created
4. ✅ **Verification Status** - Set to "approved"
5. ✅ **OTP Setup** - Ready for login

---

## Security

⚠️ Only Super Admins can access this feature
⚠️ Vendor is immediately verified (emergency use only)
⚠️ All creation is logged in server

---

## Troubleshooting

### Phone shows error
- Must be exactly 10 digits
- Cannot already be used by another user (reuse resets it)

### Vendor not appearing in list
- Refresh the screen
- Ensure company name starts with "DUMMY"

### Can't log in as dummy vendor
- Use the phone number you provided
- OTP verification should work normally

### Lost dummy vendor info
- Check the list in Settings (shown in real-time)
- All dummy vendors have "DUMMY" in company name

---

## Common Tasks

### Create 5 vendors for testing
```
Phone 1: 9876543210 → "DUMMY Test 1"
Phone 2: 9876543211 → "DUMMY Test 2"
Phone 3: 9876543212 → "DUMMY Test 3"
Phone 4: 9876543213 → "DUMMY Test 4"
Phone 5: 9876543214 → "DUMMY Test 5"
```

### Reset a dummy vendor
Just create with the same phone again and new company name

### Delete a dummy vendor
Not yet available - contact admin to remove from database

---

## Tips & Tricks

💡 Use sequential phone numbers for easy tracking
💡 Include test purpose in company name (e.g., "DUMMY Load Test")
💡 Reuse same phone with different names for quick resets
💡 Check list to see when vendors were created (timestamp shown)

---

## Next Action

Go to Super Admin Settings now and try creating your first dummy vendor! 🎉

---

**Questions?** Check the detailed documentation:
- `DUMMY_VENDOR_IMPLEMENTATION_SUMMARY.md` - Full technical details
- `DUMMY_VENDOR_CREATION_FIXED.md` - Schema and bug fixes
- `DUMMY_VENDOR_SETUP_CHECKLIST.md` - Testing checklist
