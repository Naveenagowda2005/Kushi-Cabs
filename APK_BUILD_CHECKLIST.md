# ✅ APK Build Checklist - Step by Step

Use this checklist to ensure your APK build goes smoothly. Check off each step as you complete it.

---

## 🎯 Phase 1: System Preparation (One-Time Setup)

### Prerequisites
- [ ] Windows 10/11 installed
- [ ] At least 20 GB free disk space
- [ ] Stable internet connection (broadband recommended)
- [ ] About 1-2 hours available for setup

### Install Required Tools
- [ ] **Node.js**: Download from https://nodejs.org (v20+ recommended)
  - [ ] Run installer
  - [ ] Accept defaults
  - [ ] Verify: `node --version` → should show v20+
  
- [ ] **npm**: Usually comes with Node.js
  - [ ] Verify: `npm --version` → should show 11+

- [ ] **Expo CLI**: `npm install -g expo-cli`
  - [ ] Run in PowerShell (as Admin)
  - [ ] Verify: `expo --version` → should show 52+

- [ ] **EAS CLI**: `npm install -g eas-cli`
  - [ ] Run in PowerShell (as Admin)
  - [ ] Verify: `eas --version` → should show 19+

- [ ] **Expo Account**
  - [ ] Go to https://expo.dev
  - [ ] Sign up for free account
  - [ ] Verify email
  - [ ] Note your credentials

---

## 📁 Phase 2: Project Setup

### Navigate to Project
- [ ] Open PowerShell
- [ ] Run: `cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"`
- [ ] Verify you're in correct directory: `pwd` should show the path

### Check Project Files
- [ ] File exists: `app.json`
- [ ] File exists: `eas.json`
- [ ] File exists: `package.json`
- [ ] Directory exists: `src/` (app source code)
- [ ] Directory exists: `android/` (Android native code)

### Environment Configuration
- [ ] Check `.env` file exists
- [ ] OR verify environment variables in `eas.json` under `build.production.env`

**Required values:**
- [ ] `EXPO_PUBLIC_SUPABASE_URL`: `https://cqfsirfjwfxvwggjkrvd.supabase.co`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`: (long JWT key)
- [ ] `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: (Google Maps key)
- [ ] `EXPO_PUBLIC_SMS_API_URL`: `https://kushi-cabs-27p8.onrender.com`

---

## 📦 Phase 3: Project Dependencies

### Install Dependencies
- [ ] Run: `npm install`
- [ ] Wait for completion (5-10 minutes)
- [ ] Verify: Look for "✔ packages installed" message
- [ ] Check: `node_modules/` directory should exist

### Verify Installation
- [ ] Run: `npm list react-native`
- [ ] Should show version number
- [ ] Run: `npm list expo`
- [ ] Should show version number

### Optional: Clear Cache
- [ ] Run: `npm cache clean --force`
- [ ] (Only if you had issues)

---

## 🔐 Phase 4: Expo Authentication

### Login to Expo
- [ ] Run: `eas login`
- [ ] Enter your Expo email
- [ ] Enter your Expo password
- [ ] See message: "✔ Logged in as [email]"

### Verify Login
- [ ] Run: `eas whoami`
- [ ] Should show your email
- [ ] Run: `eas build --status`
- [ ] Should show any previous builds

---

## 🏗️ Phase 5: Verify Build Configuration

### Check eas.json
- [ ] File exists: `eas.json`
- [ ] Contains `build.production` section
- [ ] Contains `build.development` section (optional)
- [ ] Contains all required environment variables

### Check app.json
- [ ] File exists: `app.json`
- [ ] `android.package` = `com.Kushi_Cabs`
- [ ] `version` = `1.0.0`
- [ ] `icon` points to valid image file

### Verify Package Configuration
- [ ] Run: `npm run --list` (shows available scripts)
- [ ] Look for any build-related scripts

---

## 🚀 Phase 6: Build the APK

### Start Cloud Build
- [ ] Run: `eas build --platform android --profile production`
- [ ] Agree to any prompts
- [ ] See message: "✔ Build queued"
- [ ] See message: "✔ Waiting for build..."

### Monitor Build Progress
- [ ] Build should take 15-30 minutes
- [ ] Monitor console for progress
- [ ] OR run: `eas build --status` in another terminal
- [ ] Status should progress: QUEUED → IN_PROGRESS → FINISHED

### Wait for Completion
- [ ] See message: "✔ Build complete"
- [ ] See APK download URL displayed
- [ ] URL format: `https://expo-builds.s3.amazonaws.com/...apk`

---

## 💾 Phase 7: Download APK

### Get Download Link
- [ ] Copy the URL from console output
- [ ] OR visit: https://expo.dev → Select project → Builds
- [ ] Click "Download" button

### Download to Computer
- [ ] Use browser or: `Invoke-WebRequest -Uri "[URL]" -OutFile "app-release.apk"`
- [ ] Save to known location (e.g., `C:\Users\YourName\Downloads\`)
- [ ] Verify file: Should be 80-120 MB in size
- [ ] Verify name: Should end with `.apk`

---

## 📱 Phase 8: Setup Android Phone

### Enable Developer Mode
- [ ] Open phone Settings
- [ ] Go to: "About Phone"
- [ ] Tap "Build Number" 7 times
- [ ] Confirmation: "You are now a developer"

### Enable Developer Options
- [ ] Go back to Settings
- [ ] Look for: "System" or "Advanced"
- [ ] Select: "Developer Options"
- [ ] Toggle ON: "USB Debugging"
- [ ] Toggle ON: "Wireless Debugging" (Android 11+)

### Note Device IP (For WiFi Installation)
- [ ] In Developer Options
- [ ] Look for "Wireless Debugging"
- [ ] Should show: "192.168.x.x:xxxxx"
- [ ] Note down the IP address (first number)

---

## 🔌 Phase 9: Connect Phone to Computer

### Option A: WiFi Connection (Recommended)
- [ ] Phone and computer on same WiFi network
- [ ] In PowerShell: `adb connect 192.168.x.x:5555` (use your phone's IP)
- [ ] Wait: ~5 seconds
- [ ] Verify: `adb devices`
- [ ] Should show: "192.168.x.x:5555 connected"
- [ ] Tap "Allow" if prompted on phone

### Option B: USB Connection
- [ ] Connect phone via USB cable
- [ ] In PowerShell: `adb devices`
- [ ] Phone serial should appear
- [ ] If it shows "unauthorized", disconnect and reconnect cable

### Troubleshooting Connection
- [ ] If not detected: `adb kill-server`
- [ ] Then: `adb start-server`
- [ ] Then: `adb connect 192.168.x.x:5555` (WiFi) or reconnect USB

---

## 📥 Phase 10: Install APK on Phone

### Uninstall Old Version (If Exists)
- [ ] Run: `adb uninstall com.Kushi_Cabs`
- [ ] (Optional: only if you had a previous install)

### Install New APK
- [ ] Run: `adb install "C:\Path\To\app-release.apk"`
- [ ] Replace path with actual location
- [ ] Wait: 30-60 seconds
- [ ] Success message: "Success"

### Verify Installation
- [ ] Phone home screen should show "Kushi Cabs" app icon
- [ ] App should appear in Settings → Apps
- [ ] App info should show version "1.0.0"

---

## 🎮 Phase 11: First Launch

### Launch App
- [ ] Tap "Kushi Cabs" icon on phone
- [ ] Wait: 10-15 seconds for first load
- [ ] App should display welcome/login screen

### Grant Permissions
- [ ] When prompted: Allow Location access
- [ ] When prompted: Allow Camera (if needed)
- [ ] When prompted: Allow Notifications (if needed)

### Load Main Screen
- [ ] App should load dashboard
- [ ] No crash messages
- [ ] UI should be responsive

---

## 🧪 Phase 12: Basic Testing

### Sign In
- [ ] On phone: Tap login
- [ ] Enter phone number: `1123456789`
- [ ] Receive OTP: `123456` (pre-configured for testing)
- [ ] Tap "Verify"
- [ ] Should see dashboard

### Check Features
- [ ] Dashboard loads without crashing
- [ ] Can view available trips
- [ ] Can view wallet balance
- [ ] Location icon works
- [ ] Navigation between screens works
- [ ] No red error messages

### Test Specific Features
- [ ] Trips section: Should load list (or empty if no trips)
- [ ] Wallet: Should show balance
- [ ] Settings: Should show profile options
- [ ] Maps: Should display Google Maps (with location)

---

## 🔍 Phase 13: Verification

### Confirm Working
- [ ] [ ] App installed successfully
- [ ] [ ] App launches without crash
- [ ] [ ] Can sign in
- [ ] [ ] Dashboard displays
- [ ] [ ] Basic navigation works

### Check Logs
- [ ] Run: `adb logcat | findstr "Kushi" > build.log`
- [ ] Wait 10 seconds
- [ ] Press: Ctrl+C to stop
- [ ] Review `build.log` for errors
- [ ] Should have minimal errors/warnings

### Performance
- [ ] App launches in < 15 seconds
- [ ] Screens transition smoothly
- [ ] No noticeable lag
- [ ] Battery usage reasonable

---

## 📊 Phase 14: Document Results

### Record Details
- [ ] APK version: `1.0.0`
- [ ] Build date: `[Date of build]`
- [ ] Build profile: `production`
- [ ] File size: `[Size in MB]`
- [ ] Download URL: `[Saved somewhere]`

### Note Issues
- [ ] Any crashes: `[None / List them]`
- [ ] Any warnings: `[None / List them]`
- [ ] Features tested: `[List what worked]`
- [ ] Features untested: `[List what wasn't tested]`

### Save APK
- [ ] Rename: `app-release-2026-08-15.apk`
- [ ] Store in: `C:\Users\YourName\Downloads\Kushi-APKs\`
- [ ] Keep for reference and distribution

---

## 🎉 Success! Now What?

### If Everything Works
- ✅ Congratulations! APK is ready for testing
- ✅ You can now use it for QA testing
- ✅ You can distribute to testers via URL or file transfer
- ✅ You can submit to Google Play Store (if ready)

### Next Steps
1. Continue testing other features
2. Identify any bugs
3. Make code changes if needed
4. Build new APK with: `eas build --platform android --profile production`
5. Repeat testing

### Keeping APKs
- Store builds with dates: `app-release-2026-08-15.apk`
- Organize in folder: `C:\APKs\Kushi-Cabs\`
- Keep version notes: `BUILD_LOG.txt`

---

## 🆘 If Something Goes Wrong

### Build Failed
- [ ] Check: `eas build --status`
- [ ] Review error message
- [ ] Fix: See `TROUBLESHOOTING.md` for specific error
- [ ] Retry: `eas build --platform android --profile production`

### Installation Failed
- [ ] Check: `adb devices` (is phone connected?)
- [ ] Fix: `adb uninstall com.Kushi_Cabs`
- [ ] Retry: `adb install app-release.apk`

### App Crashes
- [ ] Get logs: `adb logcat | findstr "Kushi"`
- [ ] Check: `.env` file has all variables
- [ ] Check: Backend is running (if local)
- [ ] Retry: Uninstall and reinstall APK

### Phone Not Detected
- [ ] Try: `adb kill-server` then `adb start-server`
- [ ] Try: USB reconnect (if USB method)
- [ ] Try: WiFi reconnect (if WiFi method)
- [ ] Check: Developer Options enabled on phone

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| **APK_BUILD_DEVELOPER_GUIDE.md** | Detailed guide with explanations |
| **APK_BUILD_CHECKLIST.md** | This file - step-by-step checklist |
| **APK_QUICK_REFERENCE.txt** | Quick commands and tips |
| **START_HERE_BUILD_APK.md** | Overview and project info |
| **verify-apk-setup.ps1** | Automated setup verification |
| **TROUBLESHOOTING.md** | Common issues and fixes |

---

## 📝 Notes Section

Use this space to record your build details:

```
Build Date: ___________________
APK Size: ___________________
Build Time: ___________________
Download URL: ___________________
Issues Encountered: ___________________
_________________________________
_________________________________

Features Tested:
□ Sign in
□ View trips
□ Wallet
□ Navigation
□ Maps
□ Location
□ Other: _____________________

Test Results:
✓ Passed: _____________________
✗ Failed: _____________________
⚠ Warnings: _____________________
```

---

## ✅ Final Checklist

Before you consider this done:

- [ ] All phases completed
- [ ] APK installed on phone
- [ ] App launches without crash
- [ ] Can sign in and view dashboard
- [ ] No critical errors in logs
- [ ] Documented any issues found
- [ ] APK saved for future reference
- [ ] Ready to do QA testing or distribution

---

**🎯 YOU'RE READY!**

Your APK is built, installed, and ready for testing. Enjoy! 🚀

---

**Document Version**: 1.0.0  
**Last Updated**: August 15, 2026  
**For**: Kushi Cabs development team
