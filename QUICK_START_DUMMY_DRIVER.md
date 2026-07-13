# 🚀 Quick Start: Create Dummy Driver/Vendor

## Current Status
✅ **Local backend is ready** - Use immediately
⏳ **Production backend** - Render redeploying, should be ready in 5-10 minutes

## Use Local Backend RIGHT NOW

### Step 1: Update App Config
Edit: `newtaxi/apps/unified/src/constants.js`

**Find (line ~271):**
```javascript
const getApiUrl = () => {
  const productionUrl = 'https://kushi-cabs.onrender.com';
  return productionUrl;
};
```

**Replace with:**
```javascript
const getApiUrl = () => {
  const localUrl = 'http://192.168.1.110:4000';
  return localUrl;
};
```

### Step 2: Restart App
1. Close the app completely
2. Reload/restart the app
3. Make sure backend is still running (`npm start` in backend folder)

### Step 3: Create Dummy Driver
1. Log in as Super Admin (phone: 9686314982)
2. Go to **Settings**
3. Scroll to **"Create Dummy Driver"** section
4. Enter phone number (e.g., 9999999999)
5. Enter driver name (optional)
6. Click **"Create Dummy Driver"**
7. ✅ Done! Driver created and can log in immediately

### Step 4: Create Dummy Vendor (Same process)
1. Scroll to **"Create Dummy Vendor"** section
2. Enter phone number
3. Enter company name (optional)
4. Click **"Create Dummy Vendor"**
5. ✅ Done! Vendor created and can log in immediately

## Switch Back to Production (Optional)
Once Render deployment is complete (in ~5-10 minutes), change back:

```javascript
const getApiUrl = () => {
  const productionUrl = 'https://kushi-cabs.onrender.com';
  return productionUrl;
};
```

## Troubleshooting

**"Network error" or "Failed to reach backend"?**
- Make sure backend is running: `npm start` in backend folder
- Check IP address is correct: `192.168.1.110`
- Check port is 4000
- Make sure app and backend are on same network

**Still getting "role not found"?**
- Make sure you restarted the app after changing constants.js
- Verify you're using the correct IP (check backend startup logs)
- Restart backend: `npm start` in backend folder

## What Happens?
- Dummy driver/vendor created immediately
- Can log in with OTP using their phone number
- Verification status: **approved** (no documents needed)
- Can take/accept trips right away
- Perfect for testing!

---

**Need production backend?** Wait 5-10 minutes for Render to redeploy, then switch back.
