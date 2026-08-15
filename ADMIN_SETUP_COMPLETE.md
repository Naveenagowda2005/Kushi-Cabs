# Super Admin Setup - Complete Guide

## What You Need

✅ Fresh Supabase account
✅ Migrations applied to database
✅ App running (Expo)
✅ Backend running (`npm run dev` in backend folder)

---

## Option 1: Super Simple (Recommended)

### Step 1: Copy-Paste SQL
```
1. Go to Supabase Dashboard
2. Click "SQL Editor" on left
3. Click "New Query"
4. Copy entire content from: newtaxi/CREATE_SUPER_ADMIN_SIMPLE.sql
5. Paste into editor
6. Click "Run" (▶️)
```

### Step 2: Login
```
1. Open Expo app
2. Select role: "Super Admin"
3. Enter phone: 9686314982
4. Enter OTP (from SMS or backend logs)
5. ✅ You're in the admin dashboard
```

---

## Option 2: Full Setup (With Details)

Use the comprehensive script: `newtaxi/ADD_SUPER_ADMIN_NEW_ACCOUNT.sql`

This includes:
- Role verification
- User creation
- Conflict handling
- Result verification

---

## Admin Credentials for Reference

| Field | Value |
|-------|-------|
| Phone | 9686314982 |
| Email | 9686314982@kushicabs.phone |
| Name | Super Admin |
| Role | Super Admin |
| Status | Active ✓ |

---

## After Login - What You Can Do

✅ **Manage Trips** - View, edit, assign trips
✅ **Manage Drivers** - View driver list, verification status
✅ **Manage Vendors** - View vendors, verify businesses
✅ **Monitor Wallets** - Check wallet balances
✅ **View Enquiries** - Customer trip requests
✅ **Settings** - Configure app parameters
✅ **Approvals** - Approve driver/vendor documents

---

## Troubleshooting

### "User not found" error?
→ Check migrations were applied
→ Run the SQL script again

### "Invalid phone number"?
→ Make sure you entered: **9686314982** (no spaces/country code)

### "OTP not received"?
→ Check backend is running
→ Look at backend terminal for the OTP code
→ Use that code in the app

### Still seeing registration flow?
→ Tap "Clear Storage for Fresh Start" button
→ Try again

---

## Files Created

📄 `newtaxi/CREATE_SUPER_ADMIN_SIMPLE.sql` - Simple 1-liner script
📄 `newtaxi/ADD_SUPER_ADMIN_NEW_ACCOUNT.sql` - Full script with checks
📄 `SUPER_ADMIN_SETUP_GUIDE.md` - Complete guide
📄 `QUICK_SUPER_ADMIN_SETUP.md` - Quick reference

---

## Next: Test More Features

After admin login works:

1. **Create Test Driver**
   - Go back to role selection
   - Select "Driver"
   - Register with different phone number

2. **Create Test Vendor**
   - Go back to role selection
   - Select "Vendor"
   - Register with different phone number

3. **Test Trip Flow**
   - Vendor creates trip enquiry
   - Driver accepts trip
   - Admin monitors in dashboard

---

## Database Verification

If you want to check the database directly:

```sql
-- Check if super admin exists
SELECT id, phone, email, full_name FROM users 
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');

-- Check all roles
SELECT * FROM roles;

-- Check all users
SELECT id, email, phone, full_name, roles.name as role FROM users 
LEFT JOIN roles ON users.role_id = roles.id;
```

---

## Production Notes

⚠️ This setup is for **development only**

For production:
- Use secure, unique credentials
- Enable proper authentication
- Implement admin verification flow
- Use environment variables
- Add audit logging

---

**You're ready!** Start with the simple SQL script above. 🚀
