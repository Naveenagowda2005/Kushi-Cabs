# Kushi-Cabs APK Build & WiFi Installation Guide

## Complete Step-by-Step Instructions

---

## Prerequisites Checklist

### System Requirements
- [ ] Windows 10 or later
- [ ] 10+ GB free disk space
- [ ] Stable internet connection
- [ ] Phone on same WiFi network

### Software Installation (Install in Order)

#### 1. Java Development Kit (JDK 17 or 21)
**Option A: Download from Oracle**
- Download: https://www.oracle.com/java/technologies/javase-downloads.html
- Choose: JDK 21 LTS
- Install with default settings

**Option B: Using Chocolatey (if installed)**
```bash
choco install openjdk
```

**Verify Installation:**
```powershell
java -version
```
Should show version 17 or 21

#### 2. Android SDK & Build Tools
**Option A: Android Studio (Recommended)**
- Download: https://developer.android.com/studio
- Install Android Studio
- Open > SDK Manager > SDK Tools
- Install:
  - Android SDK Platforms 34 & 33
  - Android SDK Build-Tools 34.0.0
  - Android Emulator
  - NDK (r21 or later)
- Set ANDROID_HOME environment variable

**Option B: Command Line Tools**
```
# Download from: https://developer.android.com/studio#command-tools
# Extract to: C:\Android\cmdline-tools\latest
# Set ANDROID_HOME=C:\Android
```

**Verify Android Installation:**
```powershell
echo $env:ANDROID_HOME
sdkmanager --list
```

#### 3. Node.js & npm
- Download: https://nodejs.org/en/download/
- Choose: LTS version (18 or later)
- Install with defaults
- ✅ Already installed: v24.13.0

**Verify:**
```powershell
node --version      # v24.13.0 ✓
npm --version       # 11.6.2 ✓
```

#### 4. Git (if not installed)
- Download: https://git-scm.com/download/win
- Install with defaults

**Verify:**
```powershell
git --version
```

---

## Step 1: Prepare the Project

### 1.1 Navigate to Project Directory

```powershell
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"
```

### 1.2 Install Node Dependencies

```powershell
npm install
```

**Expected Output:**
```
added 500+ packages in 45 seconds
```

Wait for completion. This may take 5-15 minutes.

### 1.3 Install Expo CLI

```powershell
npm install -g expo-cli
```

**Verify:**
```powershell
expo --version     # Should show version 55.x or later
```

### 1.4 Install EAS CLI (Expo Application Services)

```powershell
npm install -g eas-cli
```

**Verify:**
```powershell
eas --version      # Should show version 12.x or later
```

---

## Step 2: Configure Environment Variables

### 2.1 Create .env File in App Directory

Create file: `c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified\.env`

**Content:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTIyNDAsImV4cCI6MjA5ODgyODI0MH0.BhAbkuYzJ4KEmLM-7ItjaF2WmP4UuSZFqIaZ8ypNBEM
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-27p8.onrender.com
```

### 2.2 Verify Configuration

```powershell
# Check .env file exists
Test-Path .env     # Should return True
Get-Content .env   # Shows file contents
```

---

## Step 3: Build APK - Method A (Cloud Build - Recommended)

### 3.1 Login to Expo

```powershell
eas login
```

**If you don't have an Expo account:**
1. Visit: https://expo.dev
2. Sign up with email/GitHub
3. Return and login with credentials

### 3.2 Build APK Using EAS

```powershell
eas build --platform android --profile production
```

**Process:**
1. EAS builds in the cloud
2. Shows real-time build progress
3. May take 10-15 minutes
4. Generates APK download link when complete

**Example Output:**
```
Build started
Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Platform: Android
Profile: production
Status: Started at 2024-08-15T10:30:00Z

...building...

[100%] Build complete!

Download URL: https://expo-builds.s3.amazonaws.com/...apk
```

### 3.3 Download the APK

- Copy the download URL from the build output
- Download to your computer
- Save to easily accessible location

---

## Step 4: Build APK - Method B (Local Build - Manual Gradle)

**Use this if EAS build fails or you prefer local building**

### 4.1 Generate Android Build Files

```powershell
# Create android app build files
npx react-native init TestApp --skip-install

# Or use Expo prebuild
expo prebuild --clean
```

### 4.2 Build APK with Gradle

```powershell
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# Or build debug APK (faster, not for production)
./gradlew assembleDebug
```

**Output Location:**
- Release: `app\build\outputs\apk\release\app-release-unsigned.apk`
- Debug: `app\build\outputs\apk\debug\app-debug.apk`

### 4.3 Sign the Release APK (for Play Store)

```powershell
# Generate keystore (run once)
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.jks app-release-unsigned.apk my-key-alias

# Align APK
zipalign -v 4 app-release-unsigned.apk app-release-signed.apk
```

---

## Step 5: Enable WiFi ADB on Phone

### 5.1 Enable Developer Mode

1. Open Phone **Settings**
2. Go to **About Phone**
3. Tap **Build Number** 7 times
4. Back to Settings
5. Find **Developer Options** (or **System Settings** > **Developer Options**)
6. Enable **Developer Options**

### 5.2 Enable USB Debugging & Wireless Debugging

1. In **Developer Options**, enable:
   - ✅ **USB Debugging**
   - ✅ **Wireless Debugging** (Android 11+)

### 5.3 Connect Phone to WiFi

Ensure phone is on same WiFi network as computer

---

## Step 6: Install APK via WiFi ADB

### 6.1 Connect Phone via WiFi ADB

**Option A: Using ADB (if phone is already connected)**
```powershell
# Connect to phone via IP address
adb connect 192.168.1.xxx:5555
```

Get IP from Phone > **Developer Options** > **Wireless Debugging** > **IP Address & Port**

**Option B: Using Android Studio**
1. Open Android Studio
2. Open **Device Manager**
3. Your phone should appear in "Physical Devices"
4. Show all devices if needed

### 6.2 Install APK via ADB

```powershell
# Set APK file path
$APK_PATH = "C:\Path\To\Your\app-release.apk"

# Install APK
adb install $APK_PATH
```

**Example:**
```powershell
adb install "C:\New folder\Kushi-Cabs-master (1)\Downloads\app-release.apk"
```

**Expected Output:**
```
Installing APK: app-release.apk
Success
```

### 6.3 Verify Installation

```powershell
# List installed packages
adb shell pm list packages | findstr "Kushi"

# Output should show:
# com.Kushi_Cabs
```

---

## Step 7: Launch App on Phone

### 7.1 Manual Launch
1. Open **Settings** > **Apps** on phone
2. Find **Kushi Cabs**
3. Tap to open

### 7.2 Launch via ADB
```powershell
adb shell am start -n com.Kushi_Cabs/.MainActivity
```

---

## Step 8: Testing & Troubleshooting

### 8.1 Check App Status

```powershell
# Get detailed app info
adb shell dumpsys package com.Kushi_Cabs

# View app logs
adb logcat | findstr "Kushi"

# Stop/clear app
adb shell pm clear com.Kushi_Cabs
```

### 8.2 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **"App not installed"** | Check APK compatibility with phone's Android version (min API 23) |
| **"Couldn't find app"** | Ensure same WiFi network; restart adb: `adb kill-server` then `adb start-server` |
| **APK won't start** | Check logs: `adb logcat`; Ensure Supabase keys are correct |
| **Permission denied** | Enable USB Debugging + Wireless Debugging on phone |
| **"File not found"** | Verify APK path exists: `Test-Path $APK_PATH` |
| **Gradle build fails** | Check Java version: `java -version`; Update gradle: `gradlew wrapper --gradle-version 8.1` |

### 8.3 View Application Logs

```powershell
# Clear existing logs
adb logcat -c

# View real-time logs
adb logcat | findstr "Kushi\|com.Kushi_Cabs"

# Save logs to file
adb logcat > app-logs.txt

# View specific log levels
adb logcat *:W  # Warnings only
adb logcat *:E  # Errors only
```

---

## Step 9: Build Multiple Versions

### 9.1 Debug APK (for testing)
```powershell
eas build --platform android --profile development
```

### 9.2 Preview APK (internal testing)
```powershell
eas build --platform android --profile preview
```

### 9.3 Production APK (release)
```powershell
eas build --platform android --profile production
```

---

## Step 10: Upload to Google Play Store (Optional)

### 10.1 Create Google Play Developer Account
- Visit: https://play.google.com/console
- Pay $25 one-time registration fee
- Set up store listing

### 10.2 Prepare Release APK
```powershell
# Build release version
eas build --platform android --profile production

# Download APK from provided link
```

### 10.3 Upload to Play Store
1. Open Play Console > Your app > Release > Production
2. Upload APK
3. Fill store listing (description, screenshots, etc.)
4. Submit for review
5. Review typically takes 24-48 hours

---

## Advanced: Continuous Deployment

### Setup GitHub Actions for Auto-Build

Create `.github/workflows/build.yml`:

```yaml
name: Build APK

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: eas build --platform android --profile production --non-interactive
```

This automatically builds APK on every commit to main branch.

---

## Summary Checklist

- [ ] Java SDK installed & verified
- [ ] Android SDK installed with build-tools
- [ ] Node.js & npm working
- [ ] EAS CLI installed
- [ ] .env file configured
- [ ] Phone in Developer Mode
- [ ] WiFi ADB enabled
- [ ] Phone on same WiFi as PC
- [ ] APK built successfully
- [ ] APK installed on phone
- [ ] App launches successfully
- [ ] Test app functionality

---

## Quick Reference Commands

```powershell
# Setup
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"
npm install
npm install -g eas-cli

# Build
eas login
eas build --platform android --profile production

# WiFi Install
adb connect 192.168.1.xxx:5555
adb install app-release.apk

# Check
adb shell pm list packages | findstr "Kushi"
adb shell am start -n com.Kushi_Cabs/.MainActivity
adb logcat | findstr "Kushi"
```

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Android Developers**: https://developer.android.com
- **ADB Documentation**: https://developer.android.com/tools/adb
- **Supabase**: https://supabase.com/docs

---

## Performance Tips

1. **Optimize APK Size**
   - Remove unused dependencies
   - Use R8 code shrinking
   - Compress assets

2. **Faster Builds**
   - Use incremental builds
   - Enable Gradle caching
   - Use SSD for build files

3. **Testing Optimization**
   - Use emulator for quick testing
   - Cache dependencies
   - Use WiFi ADB for faster install

---

**Last Updated**: August 15, 2026
**Project**: Kushi-Cabs v1.0.0
**App Package**: com.Kushi_Cabs

