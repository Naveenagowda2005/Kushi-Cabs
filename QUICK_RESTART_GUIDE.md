# ⚡ QUICK RESTART GUIDE - LOCAL DEVELOPMENT

## 🚀 Fastest Way (30 seconds)

### Run PowerShell Script
```powershell
cd C:\Users\navee\OneDrive\Desktop\TAXI
.\restart-local.ps1
```

**That's it!** Both services will start automatically.

---

## 📍 Services URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://192.168.1.109:4000 | ✅ Running |
| Backend Health | http://192.168.1.109:4000/health | ✅ Check |
| Frontend | Expo (Local) | ✅ Running |

---

## 🧹 Manual Termination (If Script Fails)

### Kill All Node Processes
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Kill All npm/Expo Processes
```powershell
Get-Process expo -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## ▶️ Manual Start (If Script Fails)

### Terminal 1: Backend
```powershell
cd C:\Users\navee\OneDrive\Desktop\TAXI\backend
node index.js
```

**Wait for:**
```
✅ Taxi SMS backend listening on http://192.168.1.109:4000
🟢 SERVICE READY FOR REQUESTS
```

### Terminal 2: Frontend
```powershell
cd C:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
npm start
```

**Wait for:**
```
Expo QR code will display
```

---

## ✅ Verification

### Check Backend Running
```powershell
curl http://192.168.1.109:4000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "taxi-sms-backend",
  "timestamp": "2024-...",
  "uptime": 123.456
}
```

### Check Frontend Running
- QR code displayed in terminal
- Scan with mobile device
- App loads successfully

---

## 📱 Connect Mobile App

1. **Same WiFi Network**
   - PC and mobile on same network ✅

2. **Open Expo Go**
   - Download from Play Store / App Store

3. **Scan QR Code**
   - From terminal showing QR code

4. **App Loads**
   - Should connect to local backend
   - Check: Try API call → See logs in backend terminal

---

## 🔧 Configuration

### Backend
- **Port**: 4000
- **IP**: 192.168.1.109
- **File**: `backend/index.js`

### Frontend
- **Port**: 19000 (Expo)
- **API URL**: `http://192.168.1.109:4000`
- **File**: `newtaxi/apps/unified/.env`

---

## 🛑 Stop Services

### In Backend Terminal
```
Press Ctrl+C
```

### In Frontend Terminal
```
Press Ctrl+C (twice sometimes)
```

---

## 🔄 Restart Without Full Restart

### Just Frontend (Code Changes)
```powershell
# In frontend terminal, press 'r' to reload
# Or press Ctrl+C and npm start again
```

### Just Backend (Code Changes)
```powershell
# In backend terminal, press Ctrl+C
# Run: node index.js
```

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Port 4000 in use | `Stop-Process -Name node -Force` |
| Can't find npm | Install Node.js from nodejs.org |
| App won't connect | Check mobile on same WiFi |
| No QR code | Run `npm start` again in frontend |
| Backend won't start | Check `.env` file has SUPABASE keys |

---

## 📊 Status Check

```powershell
# All node processes
Get-Process node -ErrorAction SilentlyContinue

# Port 4000 usage
netstat -ano | findstr :4000

# Port 19000 usage  
netstat -ano | findstr :19000

# Local IP
ipconfig
```

---

## 🎯 Development Flow

1. **Start Services** → `.\restart-local.ps1`
2. **Connect Mobile** → Scan QR code
3. **Code Changes** → Save file
4. **App Reloads** → Auto-reload (frontend) or manual (backend)
5. **Watch Logs** → See requests in backend terminal
6. **Stop Services** → Ctrl+C in each terminal

---

## 💾 Files to Know

| File | Purpose |
|------|---------|
| `restart-local.ps1` | Automated restart script |
| `backend/index.js` | Backend server |
| `backend/.env` | Backend config |
| `newtaxi/apps/unified/.env` | Frontend config |
| `newtaxi/apps/unified/package.json` | Frontend dependencies |

---

## 🚀 Ready?

```bash
.\restart-local.ps1
```

**Both services starting in 30 seconds! ⚡**
