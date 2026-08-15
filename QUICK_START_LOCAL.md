# Quick Start - Local Server (30 seconds)

## TL;DR - Just Copy & Paste

### Terminal 1 - Backend
```cmd
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
npm start
```

### Terminal 2 - Frontend  
```cmd
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
npm start
```

Then press `w` for web or `a` for Android.

---

## What's Running

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Backend (Node) | 4000 | http://localhost:4000 | SMS + Admin APIs |
| Frontend (Expo Web) | 8081 | http://localhost:8081 | App UI |
| Supabase | Cloud | https://vofupwsnbcidjnifaihm.supabase.co | Database |

---

## Key Points

✅ Backend runs on **port 4000**  
✅ Frontend points to **http://localhost:4000** (updated in .env)  
✅ Database is on **Supabase Cloud** (no local DB needed)  
✅ Both servers run independently  
✅ Changes hot-reload automatically  

---

## Endpoints Available

**Backend** (http://localhost:4000):
- `POST /sms/otp` - Send OTP
- `POST /admin/create-driver-account` - Create driver
- `GET /health` - Health check
- [See full list in LOCAL_SERVER_STARTUP_GUIDE.md]

**Frontend** (http://localhost:8081):
- Full app UI
- All screens working with local backend

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 4000 in use | Change backend PORT in .env, update frontend .env URL |
| Can't connect | Check `curl http://localhost:4000/health` |
| Frontend stuck | Press `q` in Expo terminal, then `npm start` again |
| Hot reload not working | Kill and restart Expo server |

---

## Next: Test the Connection

1. Backend running? → Check: `curl http://localhost:4000/health`
2. Frontend running? → Go to: `http://localhost:8081`
3. Try login with OTP → Should hit local backend ✅

That's it! 🚀
