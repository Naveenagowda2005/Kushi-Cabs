# 🚀 RESTART LOCAL DEVELOPMENT - FULL GUIDE

## Overview
Terminate and restart both **Frontend (Expo)** and **Backend (Node.js)** using local IP address instead of production URL.

**Local IP**: `192.168.1.109`
**Status**: All services ready to restart ✅

---

## Current Configuration

### Frontend (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-27p8.onrender.com
```

### Backend (index.js)
```
Backend already configured for: http://192.168.1.109:4000
```

---

## Option 1: PowerShell Script (Automated - RECOMMENDED)

### Step 1: Kill All Processes
Create file: `restart-local.ps1`

```powershell
# ============================================================
# Kill and restart local development servers
# ============================================================

Write-Host "🔴 Terminating all node processes..." -ForegroundColor Red
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Node processes terminated" -ForegroundColor Green

Write-Host ""
Write-Host "🔴 Terminating all expo processes..." -ForegroundColor Red
Get-Process expo -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Expo processes terminated" -ForegroundColor Green

Write-Host ""
Write-Host "⏳ Waiting 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# ============================================================
# Start Backend
# ============================================================
Write-Host ""
Write-Host "🟢 Starting Backend Server..." -ForegroundColor Green
Write-Host "📍 Backend: http://192.168.1.109:4000" -ForegroundColor Cyan

cd "C:\Users\navee\OneDrive\Desktop\TAXI\backend"
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "index.js"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🟢 Starting Frontend (Expo)..." -ForegroundColor Green
Write-Host "📍 Frontend: Expo on local device" -ForegroundColor Cyan

cd "C:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified"
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start"

Write-Host ""
Write-Host "✅ Both services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Services:" -ForegroundColor Yellow
Write-Host "   Backend:  http://192.168.1.109:4000" -ForegroundColor Cyan
Write-Host "   Frontend: Available on Expo" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open Expo Go on mobile device" -ForegroundColor White
Write-Host "   2. Scan QR code from terminal" -ForegroundColor White
Write-Host "   3. App will connect to local backend" -ForegroundColor White
```

### Run the Script
```powershell
# Open PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\restart-local.ps1
```

---

## Option 2: Manual Steps (For Understanding)

### Step 1: Kill Existing Processes

**Backend:**
```powershell
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Or kill by port
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Frontend:**
```powershell
# Kill expo/npm processes
Get-Process expo -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force

# Check ports
netstat -ano | findstr :19000
netstat -ano | findstr :19001
```

### Step 2: Verify Ports Are Free

```powershell
# Check if port 4000 is available
netstat -ano | findstr :4000

# Should return nothing if free
```

### Step 3: Start Backend

```powershell
cd C:\Users\navee\OneDrive\Desktop\TAXI\backend
npm install  # if needed
node index.js
```

**Expected output:**
```
✅ Taxi SMS backend listening on http://192.168.1.109:4000
✅ Access from network at: http://192.168.1.109:4000
🟢 SERVICE READY FOR REQUESTS
```

### Step 4: Start Frontend (New Terminal)

```powershell
cd C:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
npm start
# or
expo start
```

**Expected output:**
```
Expo QR code will appear
Waiting for connection...
```

### Step 5: Connect Mobile App

1. Open **Expo Go** app on mobile
2. Scan QR code from terminal
3. App should load with **local backend** connection

---

## Configuration Files

### Frontend .env Update
Currently uses production URL. For local testing:

```
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SMS_API_URL=http://192.168.1.109:4000
```

Location: `newtaxi/apps/unified/.env`

### Backend Port Configuration
Backend already uses local IP and port 4000.

Location: `backend/index.js`
```javascript
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Taxi SMS backend listening on http://192.168.1.109:4000`);
});
```

---

## Verification Checklist

- [ ] **Backend Running**
  ```
  curl http://192.168.1.109:4000/health
  
  Should return:
  {"status":"ok","service":"taxi-sms-backend",...}
  ```

- [ ] **Frontend Running**
  - Expo running in terminal
  - QR code displayed
  - Mobile app connecting

- [ ] **Connection Working**
  - Open app on mobile
  - Try to login
  - Check backend logs for requests
  - Should see `✓ Request received`

- [ ] **API Calls Working**
  - Try SMS OTP send
  - Check backend terminal for logs
  - Should see `📨 SMS Request: POST /sms/otp`

---

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 4000
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess
Get-Process -Id <PID>

# Kill it
Stop-Process -Id <PID> -Force
```

### Backend Won't Start
```powershell
# Check Node.js installed
node --version

# Check npm dependencies
cd backend
npm install

# Try again
node index.js
```

### Expo Won't Connect
1. Ensure both devices on same WiFi network
2. Check firewall allows port 4000
3. Verify local IP with `ipconfig` (look for IPv4)
4. Update .env if IP changed

### Network Connection Issues
```powershell
# Verify local IP
ipconfig

# Look for IPv4 address like 192.168.x.x
# Update if different from 192.168.1.109

# Test connectivity from mobile
ping 192.168.1.109
```

---

## Quick Commands Reference

```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Kill all expo processes
Get-Process expo | Stop-Process -Force

# Start backend
cd C:\Users\navee\OneDrive\Desktop\TAXI\backend ; node index.js

# Start frontend
cd C:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified ; npm start

# Check backend health
curl http://192.168.1.109:4000/health

# List running processes
Get-Process | grep node
Get-Process | grep npm

# View network connections
netstat -ano | findstr :4000
netstat -ano | findstr :19000
```

---

## Network Diagram

```
┌─────────────────────────────────┐
│  Development Machine (PC)       │
│  IP: 192.168.1.109              │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Backend (Node.js)       │  │
│  │  Port: 4000              │  │
│  │  http://192.168.1.109:4000│ │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Frontend (Expo)         │  │
│  │  Port: 19000             │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
           ↑
           │ WiFi Connection
           ↓
┌─────────────────────────────────┐
│  Mobile Device                  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Expo Go App             │  │
│  │  Connects to:            │  │
│  │  192.168.1.109:4000      │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Environment Variables Explained

### EXPO_PUBLIC_SMS_API_URL
- **Current**: `https://kushi-cabs-27p8.onrender.com` (Production)
- **Local**: `http://192.168.1.109:4000` (Local Backend)

This URL tells the mobile app where to send API requests.

### Backend Port
- **Default**: 4000
- **Change in**: `backend/index.js`
- **Set to listen on**: `0.0.0.0` (all interfaces)

---

## Session Management

### Keep Terminal Open
Do NOT close the terminal windows while developing.

**Terminal 1: Backend**
```
node index.js
[Keep this running]
```

**Terminal 2: Frontend**
```
npm start
[Keep this running]
```

**Terminal 3: Optional - Mobile Device or Web**
```
[Connect to app]
```

---

## Tips for Local Development

1. **Both Services Must Run**
   - Backend: Handles API requests, SMS, database operations
   - Frontend: Handles UI, user interactions

2. **Same Network Required**
   - Both PC and mobile must be on same WiFi
   - Or use USB cable with Android emulator

3. **Watch Terminal Logs**
   - Backend logs: See all API requests
   - Frontend logs: See app crashes and warnings

4. **For Production Testing**
   - Use production URLs in .env
   - Deploy to EAS build

5. **Hot Reload Working**
   - Frontend: Save file, app reloads automatically
   - Backend: Need to restart (use npm with --watch flag)

---

## Performance Monitoring

### Backend Metrics
```
curl http://192.168.1.109:4000/health
```

Returns:
- `status`: Current status
- `service`: Service name
- `timestamp`: Server time
- `uptime`: How long server running

### Monitor Database
- Check Supabase dashboard
- View real-time query performance
- Monitor storage bucket operations

---

**Status**: Ready to restart ✅
**Local IP**: 192.168.1.109
**Backend Port**: 4000
**Frontend Port**: 19000 (Expo)

**Let's restart! 🚀**
