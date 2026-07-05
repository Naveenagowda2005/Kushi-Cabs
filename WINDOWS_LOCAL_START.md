# Windows - Start Local Servers (Step by Step)

## Prerequisites Check

- [ ] Node.js installed (`node --version` in Command Prompt)
- [ ] npm installed (`npm --version` in Command Prompt)
- [ ] Port 4000 available (not in use)
- [ ] Connected to internet (for Supabase cloud DB)

---

## Step 1: Open First Command Prompt (Backend)

1. Press `Win + R`
2. Type `cmd` and press Enter
3. Paste this command:
   ```cmd
   cd c:\Users\navee\OneDrive\Desktop\TAXI\backend && npm start
   ```

**Wait for this message** (takes 5-10 seconds):
```
✅ Taxi SMS backend listening on http://127.0.0.1:4000
```

✅ **Backend is running** - Keep this window open!

---

## Step 2: Open Second Command Prompt (Frontend)

1. Press `Win + R` again
2. Type `cmd` and press Enter (new window)
3. Paste this command:
   ```cmd
   cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi && npm start
   ```

**Wait for Expo menu** (takes 10-20 seconds):
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

✅ **Frontend is ready** - Don't close this window!

---

## Step 3: Start the App

In the second Command Prompt window, press `w` (then Enter)

**Browser will open automatically** to: `http://localhost:8081`

✅ **App is running!** 🎉

---

## What You Should See

### Browser Window (http://localhost:8081)
- Taxi app loading screen
- Login with OTP option
- All UI elements visible

### First Command Prompt (Backend)
```
✅ Taxi SMS backend listening on http://127.0.0.1:4000
```

### Second Command Prompt (Frontend)
```
█ press 'w' │ open web
```

---

## Test the Connection

1. In the app, enter your phone number
2. Click "Send OTP"
3. Check first terminal - you should see:
   ```
   📨 SMS Request: POST /sms/otp
   ```

✅ **Perfect! Frontend connected to local backend**

---

## Keep Both Windows Open

You now have:
- ✅ Backend running on `http://localhost:4000`
- ✅ Frontend running on `http://localhost:8081`
- ✅ Both connected to Supabase cloud database

Make code changes and see them hot-reload!

---

## Common Issues on Windows

### "npm not found"
- Install Node.js from https://nodejs.org/
- Restart Command Prompt after installing

### "Port 4000 is already in use"
1. Find what's using port 4000:
   ```cmd
   netstat -ano | findstr :4000
   ```
2. Note the PID number (e.g., 12345)
3. Kill it:
   ```cmd
   taskkill /PID 12345 /F
   ```
4. Start backend again

### "npm start fails with errors"
In Command Prompt:
```cmd
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
npm install
npm start
```

### Frontend won't connect to backend
1. Verify backend is running:
   ```cmd
   curl http://localhost:4000/health
   ```
2. Check file: `c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified\.env`
   - Should have: `EXPO_PUBLIC_SMS_API_URL='http://localhost:4000'`
3. Restart Expo (press `q`, then `npm start`)

---

## Useful Commands in Command Prompt

| What | Command |
|------|---------|
| Stop server | Ctrl + C |
| Clear screen | cls |
| Check Node version | node --version |
| Check npm version | npm --version |
| Test backend health | curl http://localhost:4000/health |
| Check port 4000 | netstat -ano \| findstr :4000 |

---

## Layout for Development

**Optimal Setup**:
1. Arrange windows side by side:
   - Left: Browser with app (`http://localhost:8081`)
   - Top Right: Backend terminal (Command Prompt)
   - Bottom Right: Frontend terminal (Command Prompt)

2. You can see:
   - App changes on left
   - Backend logs on top right
   - Frontend logs on bottom right

---

## Development Workflow

1. **Make a code change** (e.g., fix a button)
2. **Save the file** (Ctrl + S)
3. **Watch frontend terminal** - Should see hot reload
4. **See change in browser** - Usually automatic
5. **Test your feature** - Interact with app
6. **Check backend logs** - See API requests
7. **Debug** - Read error messages in terminals

---

## When Done

To stop everything:

1. In backend terminal: Press `Ctrl + C`
2. In frontend terminal: Press `q` or `Ctrl + C`
3. Close Command Prompt windows

---

## Files to Know

| File | Location | Purpose |
|------|----------|---------|
| Backend config | `backend\.env` | Settings like PORT=4000 |
| Frontend config | `newtaxi\apps\unified\.env` | API URL and API keys |
| Backend code | `backend\index.js` | Server implementation |
| Frontend app | `newtaxi\apps\unified\` | React Native code |

---

## Next Steps

1. ✅ Both servers running
2. Try OTP login
3. Create a dummy driver
4. Test trip creation
5. Make code changes and test locally
6. When happy, push to git

---

## Quick Copy-Paste Commands

### Command 1 (Backend)
```
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend && npm start
```

### Command 2 (Frontend)
```
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi && npm start
```

---

## Support

- **Quick questions**: See QUICK_START_LOCAL.md
- **Detailed setup**: See LOCAL_SERVER_STARTUP_GUIDE.md
- **Switch to cloud**: See BACKEND_URL_SWITCHING.md

---

**Status**: Ready to use ✅  
**Platform**: Windows  
**Difficulty**: Easy  
**Time to start**: ~2 minutes  

**Let's build!** 🚀
