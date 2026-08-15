# Network Connectivity Issue - Solution

## Problem
Frontend app (192.168.1.111:8081) cannot reach backend (192.168.1.110:4000)

**Error**: `TypeError: Network request failed`

## Root Cause
The frontend and backend are on different IP addresses:
- **Frontend**: 192.168.1.111:8081 (Expo app)
- **Backend**: 192.168.1.110:4000 (Node.js server)
- **Computer**: Different local IP than what the devices see

## Solution Options

### Option 1: Use Localhost (If on Same Machine)
If you're running both frontend and backend on the same computer:

```javascript
// constants.js
const getApiUrl = () => {
  const localUrl = 'http://localhost:4000';
  console.log('Using local API URL:', localUrl);
  return localUrl;
};
```

**Note**: This only works if the app runs on the same machine. If you're using a phone/simulator, skip this.

---

### Option 2: Use Computer's Local IP (Most Common)

1. **Find your computer's local IP**:
   ```bash
   # On Windows (Command Prompt)
   ipconfig
   
   # Look for "IPv4 Address" under your network adapter
   # Should be something like 192.168.x.x or 172.x.x.x
   ```

2. **Update constants.js**:
   ```javascript
   const getApiUrl = () => {
     // Replace 192.168.1.110 with YOUR computer's IP
     const localUrl = 'http://192.168.1.XXX:4000';
     console.log('Using local API URL:', localUrl);
     return localUrl;
   };
   ```

3. **Clear app cache** (important!):
   ```bash
   # In Expo terminal
   Press 'c' to clear cache
   ```

4. **Test endpoint** (from command line):
   ```bash
   curl http://192.168.1.XXX:4000/health
   # Should return: {"status":"ok",...}
   ```

---

### Option 3: Check Network Connection

**Verify both devices can see each other:**

```bash
# Ping the backend IP from your device/simulator
ping 192.168.1.110

# If it works: PING response
# If it fails: Network unreachable - check firewall/wifi
```

**Verify backend is actually running:**
```bash
# Check if port 4000 is listening
netstat -an | findstr :4000

# Should show: LISTENING
```

---

## Step-by-Step Fix

### 1. Find Your Computer's Actual IP
```bash
ipconfig
```
Copy the **IPv4 Address** (should be 192.168.x.x or 172.x.x.x)

### 2. Update constants.js
```javascript
// newtaxi/apps/unified/src/constants.js

const getApiUrl = () => {
  // UPDATE THIS with your computer's IP from step 1
  const localUrl = 'http://192.168.X.X:4000';  // <-- CHANGE THIS
  console.log('Using local API URL:', localUrl);
  return localUrl;
};
```

### 3. Clear Expo Cache
In the Expo terminal where your app is running:
```
Press 'c' to clear cache and reload
```

### 4. Try Again
Go back to Settings → Create Admin Trip → Fill form → Click Create

---

## Network Diagram

```
┌─────────────────────────────────────────┐
│      Your Computer (Router)             │
│  192.168.1.x (gateway/main IP)          │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    │             │
┌───▼────┐   ┌───▼────┐
│Backend  │   │Frontend│
│.110:4000│   │.111:8081
└────┬────┘   └────┬────┘
     │             │
     └─────❌──────┘
   (Network blocked or wrong IP)
```

---

## Verification Checklist

- [ ] Found computer's IP with `ipconfig`
- [ ] Updated constants.js with correct IP
- [ ] Cleared Expo cache (press 'c')
- [ ] Backend still running (`npm start`)
- [ ] Frontend app reloaded
- [ ] Can ping backend IP: `ping 192.168.x.x`
- [ ] Port 4000 is open: `netstat -an | findstr :4000`
- [ ] Tried creating admin trip again

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Still getting network error** | Double-check the IP in constants.js matches your computer |
| **Backend not running** | Run `npm start` in `/backend` folder |
| **Port 4000 in use** | Kill the process: `netstat -ano \| findstr :4000` then `taskkill /PID xxx` |
| **Firewall blocking** | Allow Node.js through Windows Firewall |
| **Wrong network** | Ensure phone/simulator is on same WiFi as computer |
| **Still can't connect** | Try using `localhost` if both on same machine |

---

## Example Output

**After fixing:**
```
LOG  🌐 Calling endpoint: http://192.168.1.100:4000/admin/create-admin-trip
LOG  📨 Response status: 200
LOG  📨 Response data: {"success": true, "message": "Admin trip created..."}
LOG  ✅ Admin trip created: [trip-uuid]
```

---

## Backend Logs Check

The backend should show:
```
✅ Taxi SMS backend listening on http://127.0.0.1:4000
✅ Access from phone at: http://192.168.1.110:4000
```

Your frontend should use the second IP (192.168.1.110 in this case).

---

## Still Not Working?

1. **Verify network connectivity**:
   ```bash
   # From your device, ping the backend
   ping [backend-ip]
   ```

2. **Check CORS is enabled** (it should be in index.js):
   ```javascript
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   }));
   ```

3. **Test backend directly** (from your computer):
   ```bash
   curl -X POST http://192.168.1.110:4000/admin/create-admin-trip \
     -H "Content-Type: application/json" \
     -d '{"pickupLocation":"test",...}'
   ```

4. **Check frontend IP in Expo**:
   - Expo shows the IP it's running on
   - Ensure your computer can be reached at that IP

---

## Success Indicators

✅ **When it works:**
1. No "Network request failed" error
2. Backend logs show the request: `👤 Admin Request: POST /create-admin-trip`
3. Response shows success
4. Trip created in database

---

**Generated**: July 2, 2026
**Issue**: Network connectivity between frontend and backend
**Status**: Requires manual IP configuration based on your network setup
