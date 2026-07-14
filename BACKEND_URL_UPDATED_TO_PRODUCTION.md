# Backend URL Updated to Production Railway

## Changes Made

### 1. Updated `constants.js`
**File:** `newtaxi/apps/unified/src/constants.js`

Changed API configuration to use production Railway backend:
```javascript
const getApiUrl = () => {
  // Use production backend on Railway
  const productionUrl = 'https://kushi-cabs-production.up.railway.app';
  console.log('Using production API URL:', productionUrl);
  return productionUrl;
};

export const API_CONFIG = {
  SMS_API_URL: getApiUrl(),
  ADMIN_API_URL: getApiUrl(),
};
```

### 2. Updated `.env` File
**File:** `newtaxi/apps/unified/.env`

Changed SMS API URL from Render to Railway:
```diff
- EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs.onrender.com'
+ EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs-production.up.railway.app'
```

## Impact

All API calls throughout the app now use:
- **SMS OTP endpoints** → `https://kushi-cabs-production.up.railway.app/sms/otp`
- **OTP Verification** → `https://kushi-cabs-production.up.railway.app/sms/verify`
- **Admin endpoints** → `https://kushi-cabs-production.up.railway.app/admin/*`

### Affected Screens
- ✅ Login/Sign Up screens (OTP functionality)
- ✅ Admin Settings (Create dummy vendors/drivers)
- ✅ Admin Trip Creation
- ✅ Delete user operations
- ✅ All other admin API calls

## What Still Uses Constants.js

The following files automatically use the new API_CONFIG:
1. `src/screens/auth/LoginScreen.js`
2. `src/screens/auth/SignUpScreen.js`
3. `src/screens/superadmin/SettingsScreen.js`
4. `src/screens/superadmin/TripsScreen.js` (trip creation)
5. `src/screens/vendor/ProfileScreen.js`
6. `src/screens/driver/ProfileScreen.js`
7. `src/screens/superadmin/DriversScreen.js`
8. `src/screens/superadmin/VendorsScreen.js`
9. `src/context/AuthContext.js`

## Testing

To verify the production backend is being used:
1. Clear app cache and reload: `npm start -c`
2. Check console logs for: `"Using production API URL: https://kushi-cabs-production.up.railway.app"`
3. Test login flow - should use Railway backend
4. Test admin features - should use Railway backend

## Backend Requirements

The Railway backend must have:
- ✅ `/sms/otp` endpoint
- ✅ `/sms/verify` endpoint
- ✅ `/admin/*` endpoints
- ✅ CORS enabled for all origins
- ✅ Connection to Supabase

## Rollback (if needed)

To revert to local development:
1. Edit `constants.js` and change URL back to `http://192.168.1.111:4000`
2. Update `.env` if needed
3. Run `npm start -c`

## Status
✅ **COMPLETE** - All backend URLs now point to production Railway deployment
