# Switch Between Local and Cloud Backend

## Current Configuration

The frontend `.env` file (`newtaxi/apps/unified/.env`) controls which backend the app uses.

---

## Option 1: Local Backend (Development)

**File**: `c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified\.env`

```dotenv
EXPO_PUBLIC_SMS_API_URL='http://localhost:4000'
```

**Requirements**:
- Backend running locally: `npm start` in `backend/` folder
- Port 4000 available

**Use When**: Developing locally, testing API changes

---

## Option 2: Cloud Backend (Render/Production)

**File**: `c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified\.env`

```dotenv
EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs.onrender.com'
```

**Use When**: Testing against production-like environment, no local backend needed

---

## How to Switch

### From Local to Cloud
1. Open `newtaxi/apps/unified/.env`
2. Change:
   ```
   EXPO_PUBLIC_SMS_API_URL='http://localhost:4000'
   ```
   to:
   ```
   EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs.onrender.com'
   ```
3. Save file
4. Frontend will hot-reload or restart Expo: `npm start`

### From Cloud to Local
1. Open `newtaxi/apps/unified/.env`
2. Change:
   ```
   EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs.onrender.com'
   ```
   to:
   ```
   EXPO_PUBLIC_SMS_API_URL='http://localhost:4000'
   ```
3. Save file
4. Make sure backend is running: `npm start` in `backend/` folder
5. Frontend will hot-reload or restart Expo: `npm start`

---

## Verify Which Backend You're Using

### Method 1: Check .env
Look at `EXPO_PUBLIC_SMS_API_URL` value

### Method 2: Check Browser Console
1. Open app in browser: `http://localhost:8081`
2. Open Developer Tools (F12)
3. Go to Network tab
4. Trigger an action (e.g., OTP login)
5. Look for API calls:
   - `localhost:4000/...` = Using Local Backend ✅
   - `kushi-cabs.onrender.com/...` = Using Cloud Backend ✅

### Method 3: Check Logs
**Backend terminal**: You'll see `SMS Request:` or `Admin Request:` logs when app hits local backend

---

## What Each Backend Can Do

| Feature | Local (4000) | Cloud (Render) |
|---------|:------------:|:--------------:|
| SMS OTP | ✅ | ✅ |
| Create Driver Account | ✅ | ✅ |
| Create Dummy Drivers | ✅ | ✅ |
| Create Dummy Vendors | ✅ | ✅ |
| Admin Endpoints | ✅ | ✅ |
| Real-time (Supabase) | ✅ | ✅ |
| Database (Supabase) | ✅ (Cloud) | ✅ (Cloud) |

**Note**: Both use the same Supabase cloud database - only the SMS/Admin API endpoint differs.

---

## Troubleshooting

### App Still Using Old URL After Change
1. Restart Expo server:
   - Press `q` in Expo terminal
   - Run `npm start` again
   - Press `w` for web

2. Clear Expo cache:
   ```cmd
   npm start -- --clear
   ```

3. Hard refresh in browser:
   - Ctrl+Shift+R (Windows)
   - Cmd+Shift+R (Mac)

### Backend Running But App Won't Connect
1. Verify backend is actually running: `curl http://localhost:4000/health`
2. Check .env has correct URL: `http://localhost:4000` (no https, http not https)
3. Check firewall isn't blocking port 4000
4. Verify network connection between frontend and backend

### API Calls Failing
1. Check which backend you're pointing to
2. If local: Is backend running?
3. If cloud: Is Render service up?
4. Check browser console for actual URL being called

---

## Git Note

✅ **Current status**: Frontend .env is set to `http://localhost:4000`

Do NOT commit different .env files between dev/production - keep one source of truth and switch manually as needed.
