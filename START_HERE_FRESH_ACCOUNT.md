# 🚀 START HERE - Fresh Supabase Account Setup

## Your Situation
✅ New Supabase account created
✅ Both servers running (Expo + Backend)
✅ Ready to set up admin user and test

---

## 🎯 Quick Start (5 minutes)

### Step 1: Create Super Admin User (2 min)

**Go to Supabase Dashboard → SQL Editor → New Query**

Copy and paste the SQL from:
```
📄 newtaxi/CREATE_SUPER_ADMIN_SIMPLE.sql
```

Then click **Run** button.

**Result:** You'll see a User ID printed. That's your admin user created!

### Step 2: Login as Super Admin (2 min)

**In the Expo app:**
1. You should see **Role Selection Screen**
2. Tap **"Super Admin"**
3. Enter Phone: **9686314982**
4. Enter OTP (check backend terminal or SMS)
5. ✅ You're in the admin dashboard!

### Step 3: Verify It Works (1 min)

Check that you can see:
- ✅ Trips Screen
- ✅ Drivers Screen
- ✅ Vendors Screen
- ✅ Settings Screen

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `newtaxi/CREATE_SUPER_ADMIN_SIMPLE.sql` | **Use this** - Simple SQL script |
| `newtaxi/ADD_SUPER_ADMIN_NEW_ACCOUNT.sql` | Advanced script with verification |
| `ADMIN_SETUP_COMPLETE.md` | Full detailed guide |
| `SUPER_ADMIN_SETUP_GUIDE.md` | Step-by-step instructions |
| `QUICK_SUPER_ADMIN_SETUP.md` | Quick reference card |

---

## 🔑 Admin Credentials

```
Phone:  9686314982
Email:  9686314982@kushicabs.phone
Role:   Super Admin
Status: Active
```

---

## ❓ Issues?

### "User not found"
→ Run migrations first:
```bash
cd newtaxi
supabase db push
```
Then run the SQL script.

### "OTP not working"
→ Make sure backend is running:
```bash
npm run dev  # in backend folder
```

### "Still seeing old registration"
→ In app, tap "Clear Storage for Fresh Start" button at bottom

### Can't find SQL Editor
→ Go to https://supabase.com/dashboard
→ Select your project
→ Left sidebar → SQL Editor

---

## 📋 Next Steps After Admin Setup

1. **Test Driver Registration**
   - Different phone number
   - Upload documents
   - Verify approval process

2. **Test Vendor Registration**
   - Company details
   - Document upload
   - Admin verification

3. **Test Trip Flow**
   - Create trip enquiry
   - Driver accepts
   - Manage status

4. **Test Admin Features**
   - Settings configuration
   - Wallet monitoring
   - Document approval

---

## 🎓 Learning Path

```
1. Admin Setup (You are here) ← Complete this first
                                  ↓
2. Test Fresh Registration     ← Then do this
                                  ↓
3. Test Trip Flow              ← Then this
                                  ↓
4. Admin Dashboard Features    ← Finally this
```

---

## 💡 Pro Tips

- Backend must be running for SMS/OTP
- Keep a note of the generated User ID
- Test with different phone numbers for each role
- Check backend logs if OTP isn't working
- Use "Clear Storage" button if app gets stuck

---

## 🚦 Status Checklist

- [ ] Super admin SQL script executed
- [ ] User created in database
- [ ] Can login with phone 9686314982
- [ ] OTP verification works
- [ ] See admin dashboard
- [ ] All screens accessible

---

**Ready?** Open `newtaxi/CREATE_SUPER_ADMIN_SIMPLE.sql` and paste it into Supabase SQL Editor. 🚀

Questions? Check the detailed guides:
- Full instructions: `ADMIN_SETUP_COMPLETE.md`
- Step-by-step: `SUPER_ADMIN_SETUP_GUIDE.md`
