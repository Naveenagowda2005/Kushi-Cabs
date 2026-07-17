# Quick Setup: ngrok Tunnel for Testing

## Why?
Railway backend is deployed but DNS isn't resolving yet. ngrok lets you test immediately using a public tunnel.

## Step 1: Download ngrok
Download from: https://ngrok.com/download

Choose Windows version and extract it.

## Step 2: Start Backend Locally
```bash
cd backend
npm start
```

Your backend should show:
```
✅ Taxi SMS backend listening on http://127.0.0.1:8080
```

## Step 3: In Another Terminal, Run ngrok
Navigate to the ngrok folder and run:
```bash
ngrok http 8080
```

It will show something like:
```
Forwarding   https://abc123-xyz.ngrok.io -> http://localhost:8080
```

**Copy that HTTPS URL** (e.g., `https://abc123-xyz.ngrok.io`)

## Step 4: Update App .env
Edit: `newtaxi/apps/unified/.env`

Change:
```
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-production.up.railway.app
```

To:
```
EXPO_PUBLIC_SMS_API_URL=https://abc123-xyz.ngrok.io
```

(Use your actual ngrok URL)

## Step 5: Rebuild AAB
```bash
cd newtaxi/apps/unified
eas build --platform android --build-profile production
```

## Step 6: Download & Test on Phone
- Download the new AAB from the EAS build
- Install on phone
- Try to login

It should work now!

---

## After Testing

Once you confirm it works, switch back to Railway URL:
```
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-production.up.railway.app
```

Railway DNS should be ready by then.

---

## ngrok Free Tier Notes
- Free sessions last a few hours
- URL changes each time you restart
- Perfect for testing while Railway DNS propagates

Once Railway DNS works, you can remove ngrok.
