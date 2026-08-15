# Complete API Endpoints Reference

## Backend API Endpoints (SMS & Admin Service)

### SMS & Authentication
| Method | Endpoint | Purpose | Location | Status |
|--------|----------|---------|----------|--------|
| POST | `/sms/otp` | Send OTP to phone | LoginScreen, SignUpScreen | ✅ Working |
| POST | `/sms/verify` | Verify OTP code | LoginScreen, SignUpScreen | ✅ Working |
| POST | `/admin/create-driver-account` | Create driver auth account | AuthContext | ✅ Working |

### Admin Operations
| Method | Endpoint | Purpose | Location | Status |
|--------|----------|---------|----------|--------|
| GET | `/admin/dummy-drivers` | List all dummy drivers | SettingsScreen | ✅ Working |
| POST | `/admin/create-dummy-driver` | Create a new dummy driver | SettingsScreen | ✅ Working |
| POST | `/admin/delete-user` | Delete user account | DriversScreen, VendorsScreen | ✅ Working |
| POST | `/admin/update-admin-phone` | Update admin phone number | SettingsScreen | ✅ Working |
| GET | `/admin/user/:userId` | Get user info | (Currently unused) | ✅ Available |
| GET | `/health` | Health check | (Currently unused) | ✅ Available |

---

## Supabase Database API (Automatic via SDK)

### Authentication
- Sign Up with Email/Password
- Sign In with Email/Password  
- Sign Out
- OTP Authentication

### Database Tables Accessed
- `users` - User profiles
- `drivers` - Driver information
- `vendors` - Vendor profiles
- `trips` - Trip data
- `wallets` - Driver/Vendor wallets
- `transactions` - Wallet transactions
- `car_types` - Car type definitions
- `seater_types` - Seating capacity
- `fuel_types` - Fuel types
- `trip_segments` - Trip segment types
- `trip_packages` - Local package trips
- `documents` - Driver/Vendor documents
- `roles` - User roles
- `app_settings` - Global app settings
- `app_policies` - App policies

### RPC Functions (Supabase Functions)
- `accept_trip()` - Accept trip atomically
- `deduct_commission()` - Deduct commission ✅ FIXED
- `create_vendor_trip()` - Create trip as vendor
- `accept_enquiry()` - Accept enquiry
- `verify_vendor()` - Verify vendor RPC
- `verify_driver()` - Verify driver status

---

## External APIs

### Google Maps
| API | Endpoint | Purpose | Status |
|-----|----------|---------|--------|
| Geocoding | `https://maps.googleapis.com/maps/api/geocode/json` | Convert address to coordinates | ✅ Working |
| Directions | `https://maps.googleapis.com/maps/api/directions/json` | Get directions between two points | ✅ Working |
| Maps App | `https://www.google.com/maps/` | Open in Google Maps app | ✅ Working |

### SMS Service (STPL)
- Used for sending actual SMS to phone numbers
- Configured in backend `.env`
- Service: `STPL_API_URL`

---

## Current Configuration

### Development
```javascript
// LocalHost (Local Network)
SMS_API_URL: "http://192.168.1.110:4000"
ADMIN_API_URL: "http://192.168.1.110:4000"
SUPABASE_URL: "https://vofupwsnbcidjnifaihm.supabase.co"
GOOGLE_MAPS_API_KEY: "AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms"
```

### Production (NEEDS UPDATE)
```javascript
// ⚠️ PRODUCTION URL NOT SET
SMS_API_URL: "https://your-production-server.com"  // ❌ MUST BE UPDATED
ADMIN_API_URL: "https://your-production-server.com" // ❌ MUST BE UPDATED
SUPABASE_URL: "https://vofupwsnbcidjnifaihm.supabase.co" // ✅ Already in production
GOOGLE_MAPS_API_KEY: "AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms" // ✅ Global
```

---

## API Files & Where They're Used

### SMS/Admin Backend
- **Backend Code**: `/backend/index.js`, `/backend/routes/`, `/backend/services/`
- **Configured in**: `apps/unified/src/constants.js`
- **Used by**: Auth screens, Admin screens
- **Port**: 4000 (dev), 443/80 (production)

### Supabase
- **Configuration**: `apps/unified/src/lib/supabase.js`
- **Used by**: All data operations via SDK
- **Type**: Cloud database (no deployment needed)

### Google Maps
- **API Key**: In `.env`
- **Used by**: Navigation, location picker, geocoding
- **Type**: Third-party external API

---

## Production Deployment Steps

### 1. Backend Deployment
- [ ] Choose hosting (Railway, AWS, Azure, etc.)
- [ ] Deploy backend code from `/backend` directory
- [ ] Set up environment variables in backend
- [ ] Get production URL
- [ ] Enable HTTPS/SSL
- [ ] Test endpoints

### 2. Update App Configuration
- [ ] Update `.env` with production URL
- [ ] Rebuild APK/AAB
- [ ] Test all endpoints in production build

### 3. Verify All Endpoints
```bash
# Test each endpoint
curl https://your-server.com/health
curl -X POST https://your-server.com/sms/otp -d '{"phone":"+91..."}'
curl https://your-server.com/admin/dummy-drivers
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Unable to connect to SMS service" | Backend not running | Start backend or check production URL |
| API returns 404 | Wrong endpoint path | Check endpoint spelling and method (GET/POST) |
| CORS error | Backend CORS not configured | Enable CORS in backend |
| Connection timeout | Firewall blocking | Open port 443 or use domain |
| "Network Error" | Local IP used in production APK | Update `.env` with actual server URL |

---

## Checklist for Production APK Build

- [ ] All backend endpoints documented above
- [ ] Production URL set in `.env`
- [ ] Backend deployed and running
- [ ] HTTPS enabled on backend
- [ ] CORS configured on backend
- [ ] All endpoints tested with curl/Postman
- [ ] SMS service configured on backend
- [ ] Supabase URL verified
- [ ] Google Maps API key valid
- [ ] No hardcoded localhost URLs
- [ ] APK rebuilt with production config
- [ ] Tested on real device

✅ = Ready for production
⚠️ = Needs verification
❌ = Needs to be configured
