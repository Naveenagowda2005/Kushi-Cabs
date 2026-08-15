# Expo App Crash Diagnosis

## Symptoms
- Expo app exits/crashes after a few seconds
- Consistent crash pattern

## Common Causes & Solutions

### 1. **Missing Environment Variables**
Check `.env` file in `newtaxi/apps/unified/`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

**Action:** Open `newtaxi/apps/unified/.env` and verify all variables are set.

### 2. **Supabase Connection Issues**
If Supabase URL/key are wrong or server is down, app will crash during auth initialization.

**Action:** 
- Verify Supabase URL and keys are correct
- Test: `curl https://your-supabase-url/rest/v1/` should return 404 (expected)

### 3. **Infinite Loop in Verification Check**
VendorNavigator has polling + real-time listeners that could cause issues.

**Action:**
- Check logs for: `VendorNavigator: Starting verification check`
- Look for repeated calls every 3 seconds

### 4. **COLORS Constant Not Initialized**
The `COLORS` proxy might fail if `getCurrentTheme()` crashes.

**Action:** 
- Check if theme is properly initialized
- Look for errors in ThemeContext

### 5. **Recent Changes that Might Cause Crashes**
- ✅ FAB position change in VendorEnquiriesScreen (syntax OK)
- ✅ VendorNavigator verification fallback (syntax OK)
- ✅ VendorDocumentUploadScreen theme colors (syntax OK)

## How to Debug

### Step 1: Check Metro Bundler Console
Watch the terminal where you ran `npm start` or `expo start`:
- Look for red errors (not just yellow warnings)
- Look for crashes or "error thrown" messages

### Step 2: Check Expo Go App Logs
In Expo Go app after crash:
- Open developer menu (shake device or ⌘D on iOS simulator)
- Look at console output or logs

### Step 3: Enable More Detailed Logging
Add this to `App.js` before other imports:
```javascript
if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (args[0]?.includes('non-serializable')) return; // Skip reanimated warnings
    originalWarn(...args);
  };
  
  console.error = (...args) => {
    console.log('❌ ERROR OCCURRED:', ...args);
    originalError(...args);
  };
}
```

### Step 4: Test Step-by-Step
1. Comment out VendorNavigator completely
2. Comment out drivers/vendor screens one by one
3. Comment out context providers one by one
4. Binary search to find which component causes crash

### Step 5: Clear Cache & Reinstall
```bash
cd newtaxi/apps/unified
npm cache clean --force
rm -rf node_modules
npm install
expo start -c  # -c clears Expo cache
```

## Most Likely Culprits (Recent Changes)

### 1. VendorNavigator Verification Check
- **File:** `src/navigation/VendorNavigator.js`
- **Issue:** Infinite polling + real-time listener might clash
- **Test:** Comment out the polling interval to see if app stays alive

### 2. AuthContext Initialization
- **File:** `src/context/AuthContext.js`
- **Issue:** If Supabase fails to initialize, whole auth system crashes
- **Test:** Check if supabase client is properly created

### 3. Theme Context
- **File:** `src/context/ThemeContext.js`
- **Issue:** COLORS proxy might crash if theme isn't set
- **Test:** Verify default theme is always set

## Commands to Run

### Clear and restart:
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm start
```

### Check for errors:
```bash
# Run with verbose logging
npm start -- --verbose
```

## What to Look For in Logs

```
❌ ERRORS:
- "Cannot read property 'xxx' of undefined"
- "ReferenceError: xxx is not defined"
- "TypeError: Attempted to use a destroyed supabase client"
- "Network request failed"
- Stack traces pointing to specific files
```

## Report Back With

When reporting the crash, provide:
1. **Exact error message** from Metro console
2. **Stack trace** (line numbers and file names)
3. **When it crashes:** On launch? After login? After specific action?
4. **Last successful log message** before crash
5. **Device/Simulator info:** iOS/Android, which device

This will help pinpoint the exact issue.
