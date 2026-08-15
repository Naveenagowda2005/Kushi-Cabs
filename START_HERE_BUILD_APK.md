# 🚀 START HERE: Build & Install Kushi-Cabs APK

## Quick Navigation

This guide will walk you through building and installing the Kushi-Cabs app on your Android phone via WiFi.

### 📋 Total Time Required
- **System Setup**: 1-2 hours (one time only)
- **APK Build**: 15-30 minutes
- **Installation**: 5 minutes
- **Testing**: 10 minutes

---

## 🎯 Three Simple Steps

### Step 1️⃣: Prepare Your System (First Time Only)

**Time: 1-2 hours**

Follow: `SYSTEM_SETUP_REQUIREMENTS.md`

This includes:
- ✅ Install Java Development Kit
- ✅ Install Android SDK
- ✅ Install Node.js & npm (already done)
- ✅ Install Expo CLI & EAS CLI
- ✅ Clone project & install dependencies
- ✅ Setup environment variables

**Checklist after Step 1:**
```
[ ] Java: java -version ✓
[ ] Android: $env:ANDROID_HOME is set ✓
[ ] Node: node --version v24.13.0 ✓
[ ] Expo: expo --version ✓
[ ] EAS: eas --version ✓
[ ] npm install completed in project ✓
[ ] .env file created with API keys ✓
```

---

### Step 2️⃣: Build APK

**Time: 15-30 minutes**

Follow: `APK_BUILD_WIFI_INSTALLATION_GUIDE.md` (Section: Step 3-5)

**Quick Build Command:**

```powershell
# Navigate to project
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"

# Login to Expo (first time only)
eas login

# Build APK
eas build --platform android --profile production
```

**What happens:**
1. Uploads source code to Expo cloud
2. Compiles React Native code
3. Builds Android APK
4. Provides download link

**When complete:** You'll see:
```
✅ Build complete!
Download URL: https://expo-builds.s3.amazonaws.com/...apk
```

Download the APK file to your computer.

---

### Step 3️⃣: Install on Phone via WiFi

**Time: 5 minutes**

Follow: `APK_BUILD_WIFI_INSTALLATION_GUIDE.md` (Section: Step 5-7)

**Quick Installation Steps:**

#### On Phone:
1. Settings > About Phone > Tap "Build Number" 7 times
2. Settings > Developer Options > Enable:
   - ✅ USB Debugging
   - ✅ Wireless Debugging
3. Note the IP address shown in Wireless Debugging

#### On Computer:

```powershell
# Connect to phone via WiFi
# Replace 192.168.x.x with your phone's IP from Developer Options
adb connect 192.168.x.x:5555

# Verify connection
adb devices
# Should show: 192.168.x.x:5555 connected

# Install APK (replace path with your APK location)
adb install "C:\Path\To\app-release.apk"

# Wait for "Success" message
# Success!
```

#### On Phone:
1. Look for "Kushi Cabs" app installed
2. Tap to open
3. Test: Sign in with phone number

---

## 🔍 Detailed Guides (Reference)

### System Setup
→ `SYSTEM_SETUP_REQUIREMENTS.md`

**Covers:**
- Java, Android SDK, Node.js installation
- Environment variable configuration
- Project dependencies setup
- Phone developer mode setup

### APK Build
→ `APK_BUILD_WIFI_INSTALLATION_GUIDE.md`

**Covers:**
- Step-by-step build process
- Cloud build (EAS) - Recommended
- Local build (Gradle) - Alternative
- APK signing for production

### WiFi Installation
→ `APK_BUILD_WIFI_INSTALLATION_GUIDE.md` (Steps 5-7)

**Covers:**
- WiFi ADB connection
- APK installation via ADB
- App launch & verification
- Basic troubleshooting

### Troubleshooting
→ `TROUBLESHOOTING.md`

**Covers:**
- Common build errors & fixes
- Installation issues
- Runtime errors
- Debug commands

### Project Analysis
→ `PROJECT_ANALYSIS.md`

**Covers:**
- Complete project overview
- Architecture & design
- Technology stack
- Feature documentation

---

## ⚡ First Time Setup Commands

Copy-paste this into PowerShell:

```powershell
# 1. Install global tools
npm install -g expo-cli eas-cli

# 2. Navigate to project
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"

# 3. Install dependencies
npm install

# 4. Verify setup
expo --version
eas --version

echo "✅ Setup complete! Now run APK build commands."
```

---

## 🚀 Build & Install (After Setup)

```powershell
# Build
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"
eas login
eas build --platform android --profile production

# (Download APK when ready)

# Install on phone
$APK_PATH = "C:\Path\To\app-release.apk"  # Update path
adb connect 192.168.1.100:5555              # Update IP from phone
adb install $APK_PATH
```

---

## 📱 Phone Setup (One Time)

1. **Enable Developer Mode**
   - Settings > About Phone > Build Number (tap 7 times)
   - Back to Settings > Developer Options > Enable

2. **Enable WiFi Debugging**
   - Settings > Developer Options
   - Toggle: USB Debugging ✅
   - Toggle: Wireless Debugging ✅
   - Note: IP Address & Port

3. **Connect to WiFi**
   - Same network as your computer

---

## 🎮 Testing the App

After installation:

1. **Open Kushi Cabs app**
   - Tap app icon on phone
   - App should load (might take 10-15 seconds first launch)

2. **Sign In**
   - Enter phone number
   - Receive OTP via SMS (if backend configured)
   - Or use test account from documentation

3. **Verify Connectivity**
   - App connects to Supabase
   - Shows trips/dashboard based on role
   - Location permission popup may appear

4. **Common First Launch Issues**
   - "No internet" → Check WiFi connection
   - "Database error" → Check .env file
   - App crashes → View logs: `adb logcat | findstr "Kushi"`

---

## 🔧 Useful Commands Reference

```powershell
# ADB Commands
adb devices                              # List connected devices
adb connect 192.168.x.x:5555           # Connect via WiFi
adb disconnect                          # Disconnect
adb install app.apk                     # Install APK
adb uninstall com.Kushi_Cabs           # Uninstall app
adb shell am start -n com.Kushi_Cabs/.MainActivity  # Launch app
adb logcat                              # View live logs
adb logcat > logs.txt                   # Save logs to file
adb shell pm clear com.Kushi_Cabs      # Clear app data
adb shell pm grant com.Kushi_Cabs android.permission.ACCESS_FINE_LOCATION

# Build Commands
eas build --platform android --profile development   # Debug build
eas build --platform android --profile preview       # Test build
eas build --platform android --profile production    # Release build
eas build --status                                   # Check build status

# Expo Commands
expo start                  # Start dev server
expo prebuild               # Generate native files
expo doctor                 # Check setup
```

---

## ⚠️ If Something Goes Wrong

### Build Failed
```powershell
# 1. Check build logs
eas build --status

# 2. Clear cache and retry
npm cache clean --force
npm install --legacy-peer-deps
eas build --platform android --profile production
```

### Installation Failed
```powershell
# 1. Restart ADB
adb kill-server
adb start-server

# 2. Reconnect
adb connect 192.168.x.x:5555

# 3. Uninstall and retry
adb uninstall com.Kushi_Cabs
adb install app-release.apk
```

### App Won't Start
```powershell
# 1. View logs
adb logcat | findstr "Kushi"

# 2. Clear app data
adb shell pm clear com.Kushi_Cabs

# 3. Verify .env configuration
# Check: EXPO_PUBLIC_SUPABASE_URL is correct
# Check: App has internet permission
```

→ For more: See `TROUBLESHOOTING.md`

---

## 📊 Project Info at a Glance

| Aspect | Details |
|--------|---------|
| **App Name** | Kushi Cabs |
| **Package** | com.Kushi_Cabs |
| **Version** | 1.0.0 |
| **Framework** | React Native (Expo) |
| **Backend** | Node.js + Express |
| **Database** | Supabase |
| **Min Android** | 7.0 (API 24) |
| **Maps** | Google Maps API |
| **Payments** | PhonePe |
| **Auth** | Phone OTP |

---

## 📚 Documentation Structure

```
Kushi-Cabs/
├── START_HERE_BUILD_APK.md                 ← You are here
├── SYSTEM_SETUP_REQUIREMENTS.md            ← Initial setup guide
├── APK_BUILD_WIFI_INSTALLATION_GUIDE.md    ← Detailed build & install
├── TROUBLESHOOTING.md                      ← Common issues & fixes
├── PROJECT_ANALYSIS.md                     ← Complete project overview
├── 00_README_PHONEPE_FIX.md               ← Payment integration notes
├── 00_START_HERE_ODOMETER.md              ← Odometer feature docs
└── [400+ other documentation files]
```

---

## ✅ Verification Checklist

Before building, verify:

```
System Readiness:
[ ] Java installed: java -version
[ ] Android SDK: $env:ANDROID_HOME is set
[ ] Node v24.13.0 installed
[ ] npm 11.6.2 installed
[ ] Expo CLI installed: expo --version
[ ] EAS CLI installed: eas --version
[ ] Project dependencies installed: npm install

Configuration:
[ ] .env file exists in project root
[ ] Contains SUPABASE URL
[ ] Contains SUPABASE API KEY
[ ] Contains GOOGLE MAPS KEY

Phone Setup:
[ ] Developer Mode enabled
[ ] USB Debugging ON
[ ] Wireless Debugging ON (Android 11+)
[ ] Connected to WiFi
[ ] IP address visible in Wireless Debugging

Build Ready:
[ ] Sufficient disk space (20+ GB free)
[ ] Internet connection stable
[ ] No antivirus blocking build process
```

---

## 🎓 Next Steps After Installation

1. **Test Core Features**
   - Sign up with phone number
   - Accept a test trip
   - View wallet/payments
   - Check map functionality

2. **Configure Backend** (if needed)
   - Backend runs on: https://kushi-cabs-27p8.onrender.com
   - SMS gateway configured
   - PhonePe payment gateway configured

3. **Explore Documentation**
   - `PROJECT_ANALYSIS.md` - Architecture & design
   - `00_START_HERE_ODOMETER.md` - Odometer feature
   - `00_README_PHONEPE_FIX.md` - Payment system
   - `ACTION_ITEMS.md` - Outstanding tasks

4. **Development**
   - Modify code in `src/` directory
   - Hot reload during development
   - Deploy new build with: `eas build --platform android --profile production`

---

## 💡 Pro Tips

1. **Faster Development**
   - Use Expo Go app for rapid testing: `expo start`
   - Only build APK when ready for final testing

2. **Better Debugging**
   - Enable React DevTools
   - Check Supabase logs for database errors
   - Monitor backend logs on Render.com

3. **Optimize APK Size**
   - Remove unused dependencies
   - Use R8 code shrinking
   - Strip unused resources

4. **Faster Installs**
   - Use WiFi ADB (faster than USB)
   - Clear app cache before reinstall
   - Test on real device (not emulator)

---

## 📞 Support & Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Android Developers**: https://developer.android.com
- **Supabase**: https://supabase.com/docs
- **ADB Guide**: https://developer.android.com/tools/adb

---

## 🎉 You're Ready!

**Next Step:** Follow `SYSTEM_SETUP_REQUIREMENTS.md` to set up your development environment.

After setup, you can build and install the APK in under 30 minutes!

---

**Kushi-Cabs APK Build Guide**
Version: 1.0.0
Last Updated: August 15, 2026

