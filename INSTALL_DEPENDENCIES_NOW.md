# Install Dependencies - Quick Fix

## The Issue
iOS bundling failed because `expo-linking` is missing from dependencies.

## Quick Fix (3 Steps)

### Step 1: Navigate to App Directory
```bash
cd newtaxi/apps/unified
```

### Step 2: Install Dependencies
Choose one:

**Using npm:**
```bash
npm install
```

**Using yarn:**
```bash
yarn install
```

**Using pnpm:**
```bash
pnpm install
```

### Step 3: Clear Expo Cache and Restart
```bash
expo start -c
```

Or if using the newer expo CLI:
```bash
expo start --clear
```

## What This Does

1. **Installs expo-linking** - Provides URL scheme handling for PhonePe deep links
2. **Updates all dependencies** - Ensures all packages are properly installed
3. **Clears cache** - Removes any stale bundler cache that might cause issues

## Expected Output

After running `npm install`, you should see:
```
added X packages in Y seconds
```

When starting the app with `expo start -c`, you should see:
```
✓ Bundled successfully
✓ Minified 12 MB of assets
```

## If You Get Errors

### Error: "Unable to find module expo-linking"
- Run `npm install expo-linking@~9.0.0` explicitly
- Clear node_modules: `rm -rf node_modules && npm install`

### Error: "Expo is not installed globally"
- Install Expo CLI: `npm install -g expo-cli`
- Or use: `npx expo start`

### Error: "Port 8081 already in use"
- Kill existing process: `lsof -ti:8081 | xargs kill -9` (macOS/Linux)
- Or specify different port: `expo start --port 8082`

## Verify Installation

Check that expo-linking is installed:
```bash
npm list expo-linking
```

Should output:
```
kushi-cabs-app@1.0.0 /path/to/apps/unified
└── expo-linking@9.0.0
```

## Testing After Installation

### On Android
1. Run app: `expo start`
2. Press `a` for Android emulator
3. Go to Wallet screen
4. Click "Add Funds"
5. Enter amount
6. Click "Pay" - PhonePe should open

### On iOS (Simulator)
1. Run app: `expo start`
2. Press `i` for iOS simulator
3. Go to Wallet screen
4. Click "Add Funds"
5. Enter amount
6. Click "Pay" - Should show "iOS Limitation" message

## Files Changed

1. **package.json** - Added `"expo-linking": "~9.0.0"`
2. **src/components/PhonePePaymentModal.js** - Updated imports and logic

## Next Steps

After installation:
1. ✅ iOS bundling should work
2. ✅ Android PhonePe deep linking ready
3. ✅ iOS shows user-friendly message
4. Ready for payment testing on Android devices

---

**Time Required:** 2-3 minutes for full installation and cache clear
