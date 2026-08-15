# 🎯 Local APK Build Guide for Developer Testing

## Quick Start (TL;DR)

```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
eas build --platform android --profile production
```

Done! Your APK will be built in the Expo cloud and ready to download in ~15-30 minutes.

---

## 📋 Prerequisites (One-Time Setup)

### 1. System Requirements
- Windows 10/11
- At least 20 GB free disk space
- Stable internet connection

### 2. Install Required Tools

Run these commands in PowerShell (as Administrator):

```powershell
# Install Node.js (if not already installed)
# Verify: node --version (should be v20+)

# Install global CLI tools
npm install -g expo-cli eas-cli

# Verify installation
expo --version
eas --version
```

### 3. Project Setup

```powershell
# Navigate to project
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"

# Install dependencies
npm install

# Verify setup
npm list react-native expo
```

### 4. Environment Configuration

Check the `.env` file exists with these variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-27p8.onrender.com
```

---

## 🚀 Build Options

### Option 1: Cloud Build (Recommended) - Easiest

**Pros:**
- ✅ No local setup required (Java, Android SDK, Gradle)
- ✅ Works on any machine
- ✅ Faster (Expo cloud does the work)
- ✅ Recommended for testing

**Cons:**
- Requires internet upload of source code
- Takes 15-30 minutes
- Need Expo account

**Steps:**

```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"

# Login (first time only)
eas login
# Enter email and password

# Build production APK
eas build --platform android --profile production

# Check build status
eas build --status

# When complete, download the APK from the link shown
```

**Expected Output:**
```
✅ Build complete!
📱 APK ready for download: https://expo-builds.s3.amazonaws.com/...apk
```

---

### Option 2: Local Build with Gradle - Advanced

**Requires:**
- Java Development Kit (JDK 17+)
- Android SDK (large download)
- Gradle build system
- ~30-45 minutes setup time

**Only use if:**
- You want to build completely offline
- You need custom modifications
- Cloud build has issues

**Setup Steps:**

```powershell
# 1. Install Java JDK 17
# Download: https://www.oracle.com/java/technologies/downloads/

# 2. Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
[Environment]::SetEnvironmentVariable("JAVA_HOME", $env:JAVA_HOME, "User")

# 3. Install Android SDK
# Download: https://developer.android.com/studio
# or use: choco install android-sdk

# 4. Set ANDROID_HOME
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")

# 5. Build
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"

# Generate native files
expo prebuild --clean

# Build APK
eas build --platform android --local
```

**Not recommended for initial testing.** Use cloud build first.

---

## 📱 Building APK - Step by Step

### Step 1: Navigate to Project

```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
```

### Step 2: Login to Expo (First Time Only)

```powershell
eas login
```

**If you don't have an Expo account:**
- Go to: https://expo.dev
- Click "Sign Up"
- Enter email, password
- Verify email
- Return to PowerShell and login

### Step 3: Start the Build

```powershell
# Production build (recommended for testing)
eas build --platform android --profile production
```

**Alternative profiles:**

```powershell
# Development build (faster, for local testing)
eas build --platform android --profile development

# Preview build (intermediate)
eas build --platform android --profile preview
```

### Step 4: Monitor Build Progress

```powershell
# Check build status in real-time
eas build --status

# Output shows:
# Status: FINISHED
# Platform: android
# Distribution: internal
# Artifacts: [APK URL]
```

### Step 5: Download APK

When build completes:

1. Check the console output for the download link
2. Or visit: https://expo.dev → Your Project → Builds
3. Click the completed build
4. Download the `.apk` file

---

## 💾 What You'll Get

| File | Size | Use Case |
|------|------|----------|
| **app-release.apk** | 80-120 MB | Production testing, distribution |
| **app-debug.apk** | 100-150 MB | Development, debugging |

For testing: Use the APK from the download link provided after build completes.

---

## 📲 Installing on Your Phone

### Prerequisites:
- Android phone
- USB cable or WiFi ADB setup
- 5+ minutes

### Option A: WiFi Installation (Recommended)

**On Phone:**
1. Settings > About Phone > Tap "Build Number" 7 times
2. Settings > System > Developer Options
3. Toggle "Wireless Debugging" ✅
4. Note the IP Address (e.g., 192.168.1.100)

**On Computer:**
```powershell
# Connect via WiFi
# Replace 192.168.1.100 with your phone's IP
adb connect 192.168.1.100:5555

# Verify connection
adb devices
# Should show: 192.168.1.100:5555 connected

# Install APK
adb install "C:\Path\To\app-release.apk"

# Wait for: "Success"
```

**On Phone:**
- App "Kushi Cabs" appears
- Tap to open and test

### Option B: USB Installation

```powershell
# Connect phone via USB cable

# Enable USB Debugging on phone:
# Settings > Developer Options > USB Debugging ✅

# In PowerShell:
adb devices
# Should show your phone

# Install
adb install "C:\Path\To\app-release.apk"

# Success!
```

---

## 🎮 Testing the App After Installation

### Initial Launch

1. Tap "Kushi Cabs" icon
2. Allow location access when prompted
3. Home screen should load in 5-10 seconds

### Test Account (Driver)

```
Phone: 1123456789
OTP: 123456 (configured for testing)
```

### Test Features

- **Sign In**: Enter phone → receive OTP → verify
- **Dashboard**: View available trips
- **Wallet**: Check balance
- **Location**: Check GPS works
- **Payments**: PhonePe integration (sandbox mode)

### Common Issues

| Issue | Solution |
|-------|----------|
| "App won't open" | Restart phone, clear app cache |
| "Can't connect to server" | Check backend is running, verify `.env` URLs |
| "Location not working" | Grant permission in Settings > Apps > Kushi Cabs |
| "Crash on startup" | Check logs: `adb logcat \| findstr Kushi` |

---

## 🔍 Viewing Logs

### Real-Time Logs

```powershell
# View all logs
adb logcat

# Filter for Kushi logs
adb logcat | findstr "Kushi"

# Save to file for analysis
adb logcat > kushi_logs.txt
```

### Clear App Cache

```powershell
adb shell pm clear com.Kushi_Cabs
```

### Uninstall App

```powershell
adb uninstall com.Kushi_Cabs
```

---

## 📊 Build Profiles Explained

### Development
- Fast compilation
- Includes dev tools
- Large APK size (~150 MB)
- For local testing

### Preview
- Balanced build
- No dev tools
- Medium APK size (~100 MB)
- For team testing

### Production
- Optimized and minified
- Smallest APK size (~80 MB)
- For release/distribution
- Recommended for testing

---

## 🐛 Troubleshooting

### Build Fails

```powershell
# Clear cache and retry
npm cache clean --force
npm install --legacy-peer-deps

# Rebuild
eas build --platform android --profile production
```

### Can't Login to Expo

```powershell
# Verify credentials
eas whoami

# Re-login
eas logout
eas login
```

### APK Won't Install

```powershell
# Uninstall old version first
adb uninstall com.Kushi_Cabs

# Then install
adb install app-release.apk

# Check for corrupted file
# Re-download from Expo
```

### App Crashes Immediately

```powershell
# Check logs
adb logcat | findstr "Kushi" | head -50

# Common causes:
# 1. Missing env variables
# 2. Supabase connection issue
# 3. Backend not running

# Check .env file
cat ".env"
```

### Phone Not Detected by ADB

```powershell
# Restart ADB
adb kill-server
adb start-server

# Check device
adb devices

# If still not showing:
# 1. Reconnect USB cable
# 2. Enable USB Debugging in phone settings
# 3. Restart phone
```

---

## 🚀 Advanced: Direct Gradle Build (Optional)

For complete control and offline builds:

```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"

# Install local dependencies
expo prebuild --clean

# Navigate to Android folder
cd android

# Build APK using Gradle
gradle assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

⚠️ **Requires Java + Android SDK setup.** Not recommended for beginners.

---

## 📚 Quick Command Reference

```powershell
# Build Commands
eas build --platform android --profile production   # Cloud build
eas build --platform android --profile development  # Debug build
eas build --status                                  # Check status
eas logout                                          # Logout from Expo

# ADB Commands
adb devices                              # List connected devices
adb connect 192.168.x.x:5555           # Connect via WiFi
adb install app-release.apk            # Install APK
adb uninstall com.Kushi_Cabs          # Uninstall app
adb logcat                             # View logs
adb shell pm clear com.Kushi_Cabs     # Clear cache
adb shell am start -n com.Kushi_Cabs/.MainActivity  # Launch app

# Project Commands
npm install                 # Install dependencies
npm start                  # Start dev server
expo doctor               # Check setup
expo prebuild --clean     # Generate native files
```

---

## 💡 Best Practices

1. **Always start with cloud build** (easiest, most reliable)
2. **Test on real Android device** (not emulator, for WiFi testing)
3. **Keep APK versions organized** (name with date: app-release-2026-08-15.apk)
4. **Check logs before reporting bugs** (90% of issues visible in logs)
5. **Use development profile for rapid testing** (faster builds)
6. **Switch to production for final testing** (matches release APK size/performance)

---

## 📈 Build Time Estimates

| Step | Time |
|------|------|
| Cloud build (first time) | 20-30 min |
| Cloud build (subsequent) | 15-20 min |
| WiFi APK installation | 2-3 min |
| First app launch | 10-15 sec |
| Subsequent launches | 2-3 sec |

**Total: 25-45 minutes from start to running app**

---

## ✅ Verification Checklist

Before building:
- [ ] Node.js v20+ installed
- [ ] Expo CLI installed: `expo --version`
- [ ] EAS CLI installed: `eas --version`
- [ ] In correct directory: `/newtaxi/apps/unified`
- [ ] Dependencies installed: `npm install`
- [ ] `.env` file exists with all variables
- [ ] Expo account created and logged in
- [ ] Internet connection stable

After APK download:
- [ ] APK file exists on computer (~80-120 MB)
- [ ] Phone has USB Debugging or WiFi Debugging enabled
- [ ] ADB connection confirmed: `adb devices`
- [ ] APK installed successfully: `adb install app-release.apk`
- [ ] App launches without crashing
- [ ] Can sign in and navigate screens

---

## 🎯 Next Steps

1. **First Build**
   ```powershell
   eas build --platform android --profile production
   ```

2. **Wait for Completion**
   - Takes 15-30 minutes
   - Check status: `eas build --status`

3. **Download APK**
   - From console output or Expo website

4. **Install on Phone**
   ```powershell
   adb install app-release.apk
   ```

5. **Test Features**
   - Sign in with phone
   - Navigate app screens
   - Check functionality

6. **Debug if Needed**
   ```powershell
   adb logcat | findstr "Kushi"
   ```

---

## 📞 Resources

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/setup/
- **React Native**: https://reactnative.dev/docs/environment-setup
- **Android ADB**: https://developer.android.com/tools/adb
- **Kushi Cabs Issues**: Check `TROUBLESHOOTING.md`

---

## 🎉 You're Ready!

Your APK build workflow is now set up and ready for testing. Start with:

```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
eas build --platform android --profile production
```

**Estimated time to running app: 25-45 minutes**

Good luck! 🚀

---

**Document Version**: 1.0.0  
**Last Updated**: August 15, 2026  
**For**: Local developer testing
