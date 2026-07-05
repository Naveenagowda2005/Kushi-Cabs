# Local Server Startup Guide

## Overview
This guide explains how to start both backend and frontend servers locally on your development machine.

**Frontend**: Expo app (web/mobile via CLI)
**Backend**: Node.js + Express on port 4000

---

## Prerequisites
- Node.js and npm installed
- Supabase connection active (uses cloud database)
- Port 4000 available for backend

---

## STEP 1: Start Backend Server

### Open Terminal/PowerShell
```cmd
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
```

### Start Backend
```cmd
npm start
```

**Expected Output:**
```
🔧 Environment loaded
📦 Express loaded
📦 CORS loaded
📦 SMS router loaded
📦 Admin router loaded
🔧 Configured port: 4000
✅ Taxi SMS backend listening on http://127.0.0.1:4000
✅ Access from phone at: http://192.168.1.110:4000
📱 API endpoints:
   - POST /sms/otp - Send OTP
   - POST /sms/verify - Verify OTP
   - POST /admin/create-driver-account - Create driver account
   ... (other endpoints)
```

**Backend is running** ✅ Keep this terminal open.

---

## STEP 2: Start Frontend Server

### Open New Terminal/PowerShell
```cmd
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
```

### Install Dependencies (if not already done)
```cmd
npm install
```

### Start Frontend (Expo)
```cmd
npm start
```

**Expected Output:**
```
█ Expo  @54.0.35
█ Local:   http://localhost:8081
█ 
█ Tunnel connected
█ press 'i' │ open iOS simulator
█ press 'a' │ open Android emulator
█ press 'w' │ open web
█ press 'c' │ open Expo Clipboard
█ press 'e' │ export
█ press 's' │ sign out
█ press 'q' │ quit
```

---

## STEP 3: Run the App

### Option A: Web (Easiest for development)
Press `w` in the Expo terminal to open web version.

**Accessible at:** `http://localhost:8081`

### Option B: Android Emulator
Press `a` in the Expo terminal (requires Android emulator setup).

### Option C: iOS Simulator
Press `i` in the Expo terminal (requires Xcode on macOS).

---

## Configuration

### Frontend .env Updated ✅
```
EXPO_PUBLIC_SMS_API_URL='http://localhost:4000'
```

The frontend now points to your local backend instead of the Render URL.

### Backend Configuration
- **Port**: 4000 (from `backend/.env`)
- **CORS**: Enabled for all origins during development
- **Supabase**: Uses cloud database (no local DB needed)

---

## Verification

### Test Backend
```bash
# In a new terminal, test the health endpoint:
curl http://localhost:4000/health

# Expected Response:
# {"status":"ok","service":"taxi-sms-backend","timestamp":"..."}
```

### Test Frontend Connection
1. Start app (web or mobile)
2. Try OTP login - should connect to local backend
3. Check browser/app console for any errors

---

## Troubleshooting

### Backend Port 4000 Already in Use
```
❌ Port 4000 is already in use!
```

**Solution**: Kill process on port 4000
```cmd
# PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force

# Or change PORT in backend/.env to 5000 and update frontend .env to http://localhost:5000
```

### Frontend Won't Start
```cmd
# Clear cache and reinstall
rm -Force -Recurse node_modules
rm package-lock.json
npm install
npm start
```

### App Can't Connect to Backend
- Check backend is running: `curl http://localhost:4000/health`
- Check frontend .env has correct URL: `http://localhost:4000`
- Check firewall isn't blocking port 4000

### Expo Tunnel Issues
```cmd
# Restart Expo
# Press 'q' to quit, then:
npm start
```

---

## Development Workflow

1. **Terminal 1 (Backend)**:
   ```cmd
   cd backend
   npm start
   ```

2. **Terminal 2 (Frontend)**:
   ```cmd
   cd newtaxi
   npm start
   # Then press 'w' for web or 'a' for Android
   ```

3. **Make Code Changes**:
   - Backend changes: Server auto-restarts (if using nodemon)
   - Frontend changes: Hot reload automatically

4. **Check Logs**:
   - Backend logs in Terminal 1
   - Frontend logs in Terminal 2 + browser console

---

## Important Notes

✅ **Supabase Cloud**: Database remains on cloud (no local setup needed)
✅ **Backend Only**: SMS and admin endpoints
✅ **Frontend**: Full app functionality
✅ **Real-time**: Supabase subscriptions work with cloud DB

❌ **Do NOT use Render URLs** when running locally - use `http://localhost:4000`

---

## Next Steps

Once both servers are running:
1. Test driver/vendor login with OTP
2. Test trip creation and assignment
3. Monitor logs for any issues
4. Make your code changes and test locally before pushing

**Happy coding!** 🚀
