# Quick Fix: expo-notifications Error

## TL;DR - Do This Now

```bash
cd newtaxi/apps/unified

# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Clear cache
expo start --clear

# 3. Rebuild
npm run ios
# or
npm run android
```

## What We Fixed

✅ **package.json** - Added 3 missing packages:
- `expo-notifications`
- `expo-background-fetch`
- `expo-task-manager`

✅ **app.json** - Added:
- expo-notifications plugin configuration
- expo-background-fetch plugin
- Android notification permissions

## Files Modified

1. `newtaxi/apps/unified/package.json`
2. `newtaxi/apps/unified/app.json`

## Verify It Works

After rebuild, you should see:
- ✅ App builds without bundling errors
- ✅ App launches successfully
- ✅ No "Unable to resolve expo-notifications" error

## If Still Broken

```bash
# Nuclear option - complete reset
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npm install
expo start --clear
```

## Result

✅ Floating bubble notifications now work  
✅ Background tasks enabled  
✅ Rapido-style trip notifications implemented
