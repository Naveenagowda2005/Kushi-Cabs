# 🔨 Local Gradle APK Build Guide - Native Android Build

## Quick Start (TL;DR)

```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"

# 1. Generate native Android files
expo prebuild --clean

# 2. Build APK with Gradle
cd android
.\gradlew assembleRelease
```

**Output**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📋 Prerequisites - Complete Setup

### 1. System Requirements
- Windows 10/11
- At least 30 GB free disk space (important!)
- Stable internet connection
- Administrator access (for some installations)

### 2. Install Java Development Kit (JDK 17+)

**Option A: Download from Oracle**
```powershell
# Download JDK 17+ from:
# https://www.oracle.com/java/technologies/downloads/

# Run installer and follow prompts
# Default path: C:\Program Files\Java\jdk-17.x.x (or higher)

# Verify installation
java -version
javac -version
```

**Option B: Using Chocolatey (if installed)**
```powershell
choco install openjdk17 -y
```

### 3. Set JAVA_HOME Environment Variable

```powershell
# Open PowerShell as Administrator

# Set for current session
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Make permanent (User level)
[Environment]::SetEnvironmentVariable(
    "JAVA_HOME",
    "C:\Program Files\Java\jdk-17",
    "User"
)

# Verify
echo $env:JAVA_HOME
# Should output: C:\Program Files\Java\jdk-17
```

### 4. Install Android SDK

**Option A: Android Studio (Recommended)**
1. Download: https://developer.android.com/studio
2. Run installer, follow prompts
3. On first launch, it installs Android SDK automatically
4. Accept license agreements
5. Default path: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

**Option B: Command Line SDK Manager**
```powershell
# Download: https://developer.android.com/studio
# Extract to a location, then:
cd "C:\Path\To\Android\Tools\bin"
.\sdkmanager --list_installed
```

### 5. Set ANDROID_HOME Environment Variable

```powershell
# Open PowerShell as Administrator

# Set for current session
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

# Make permanent (User level)
[Environment]::SetEnvironmentVariable(
    "ANDROID_HOME",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
    "User"
)

# Verify
echo $env:ANDROID_HOME
# Should output: C:\Users\YourUsername\AppData\Local\Android\Sdk
```

### 6. Update Android SDK (One-Time Setup)

```powershell
# If using Android Studio, open it and go to:
# Tools → SDK Manager

# Install these:
# - Android SDK Platform 35 (or latest)
# - Build Tools 35.0.0
# - Android Emulator (if testing with emulator)
# - NDK (optional)

# Or via command line:
$sdkManager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager"
& $sdkManager "build-tools;35.0.0"
& $sdkManager "platforms;android-35"
```

### 7. Add to PATH (Optional but Recommended)

```powershell
# Open PowerShell as Administrator

# Add Android SDK tools to PATH
$androidPath = "$env:ANDROID_HOME\cmdline-tools\latest\bin"
$pathVar = [Environment]::GetEnvironmentVariable("Path", "User")

if ($pathVar -notlike "*$androidPath*") {
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$pathVar;$androidPath",
        "User"
    )
}
```

---

## ✅ Prerequisites Verification Checklist

```powershell
# Check Java installation
java -version
# Output: java version "17.x.x" (or higher)

javac -version
# Output: javac 17.x.x (or higher)

# Check JAVA_HOME
echo $env:JAVA_HOME
# Output: C:\Program Files\Java\jdk-17 (or similar)

# Check Node.js
node --version
# Output: v20.x.x (or higher)

# Check npm
npm --version
# Output: 10.x.x (or higher)

# Check Android SDK
ls "$env:ANDROID_HOME\platforms"
# Should show: android-35 (or latest)

# Check Build Tools
ls "$env:ANDROID_HOME\build-tools"
# Should show: 35.0.0 (or latest)
```

**If any check fails, go back and complete that step!**

---

## 🚀 Step-by-Step Build Process

### Step 1: Navigate to Project

```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
```

### Step 2: Install Dependencies

```powershell
# Clean install (recommended)
npm install --legacy-peer-deps

# Or if you already have node_modules:
npm ci
```

### Step 3: Generate Native Android Files

```powershell
# This creates the native Android project from Expo
expo prebuild --clean

# ✅ Success indicators:
# - Creates ./android folder structure
# - Shows: "✅ Run: npm start -- --android"
# - No errors about missing plugins
```

⚠️ **If you see errors:**
```powershell
# Try with more verbose output
expo prebuild --clean --verbose

# Common fixes:
npm cache clean --force
expo cache clean
expo prebuild --clean
```

### Step 4: Navigate to Android Folder

```powershell
cd android
```

### Step 5: Build Release APK

```powershell
# Using gradlew.bat (Windows batch file)
.\gradlew assembleRelease

# Or using gradlew (if batch file doesn't work)
gradlew assembleRelease
```

**Build output:**
```
BUILD SUCCESSFUL

Total time: 2m 45s
```

### Step 6: Verify APK Output

```powershell
# Check if APK was created
ls app\build\outputs\apk\release\

# You should see: app-release.apk (~80-120 MB)

# Full path:
# c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified\android\app\build\outputs\apk\release\app-release.apk
```

---

## 🔧 Build Variants Explained

### Release Build (Recommended for Testing)
```powershell
.\gradlew assembleRelease
```
- Optimized and minified
- Smallest size (~80 MB)
- Production-ready
- Slower build time (~3-5 min)
- **Use this for testing**

### Debug Build (Fast, Large Size)
```powershell
.\gradlew assembleDebug
```
- Fast build (~1-2 min)
- Larger size (~150 MB)
- Debuggable code included
- Use only for development

### Clean Build (If Issues)
```powershell
.\gradlew clean assembleRelease
```
- Removes all previous builds
- Fresh compilation
- Takes longer (~5-8 min)
- Use if build cache corrupted

---

## 📊 Build Time Estimates

| Step | Time |
|------|------|
| prebuild (first time) | 2-3 min |
| gradlew assembleRelease (first) | 3-5 min |
| gradlew assembleRelease (cached) | 1-2 min |
| Total (first time) | 5-10 min |
| Total (subsequent) | 1-3 min |

---

## 📱 Installing APK on Your Phone

### Option A: WiFi Installation (Recommended)

**On Phone:**
```
1. Settings > About Phone > Tap "Build Number" 7 times
2. Settings > System > Developer Options
3. Toggle "Wireless Debugging" ✅
4. Note the IP Address (e.g., 192.168.1.100:5555)
```

**On Computer:**
```powershell
# Navigate to APK location
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified\android\app\build\outputs\apk\release"

# Connect to phone
adb connect 192.168.1.100:5555

# Verify connection
adb devices
# Should show: 192.168.1.100:5555 connected

# Install APK
adb install app-release.apk

# Success message:
# Success
```

### Option B: USB Installation

```powershell
# Connect phone via USB cable

# Enable USB Debugging on phone:
# Settings > Developer Options > USB Debugging ✅

# Verify connection
adb devices
# Should show: your_device connected

# Install
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified\android\app\build\outputs\apk\release"
adb install app-release.apk
```

---

## 🎮 Testing After Installation

### Test Account (Driver)
```
Phone: 1123456789
OTP: 123456 (configured for testing)
```

### Basic Testing Flow
1. ✅ App installs successfully
2. ✅ App opens without crashing
3. ✅ Sign in with phone number
4. ✅ Receive OTP (123456)
5. ✅ Dashboard loads
6. ✅ Can view trips
7. ✅ Location access works
8. ✅ Payments flow works

---

## 🐛 Troubleshooting

### Build Fails: "JAVA_HOME Not Set"
```powershell
# Fix: Set Java home
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
echo $env:JAVA_HOME

# Then retry build
cd android
.\gradlew assembleRelease
```

### Build Fails: "Android SDK Not Found"
```powershell
# Fix: Set Android home
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
echo $env:ANDROID_HOME

# Verify SDK exists
ls $env:ANDROID_HOME

# Then retry
.\gradlew assembleRelease
```

### Build Fails: "Gradle Daemon Crashed"
```powershell
# Kill daemon
.\gradlew --stop

# Clear cache
.\gradlew clean

# Retry with verbose output
.\gradlew assembleRelease -d
```

### Build Hangs or Takes Too Long
```powershell
# Check running processes
Get-Process | findstr gradle

# Kill if needed
Stop-Process -Name "java.exe" -Force

# Retry
.\gradlew clean assembleRelease
```

### APK Won't Install on Phone
```powershell
# First uninstall old version
adb uninstall com.Kushi_Cabs

# Then install new
adb install app-release.apk

# If still fails, check permissions:
# Settings > Apps > Kushi Cabs > Permissions
# Grant all requested permissions
```

### App Crashes on Startup
```powershell
# View logs
adb logcat | findstr "Kushi"

# Save logs to file
adb logcat > kushi_crash_logs.txt

# Check for:
# 1. Missing .env variables
# 2. Backend not running
# 3. Network connectivity issues
```

### "Gradle wrapper not found" Error
```powershell
# This shouldn't happen, but if it does:
cd android

# Check if gradlew exists
ls -la gradlew*

# If missing, regenerate
cd ..
expo prebuild --clean --force

cd android
.\gradlew assembleRelease
```

---

## 🎯 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "JAVA_HOME not set" | Environment variable missing | Set JAVA_HOME to JDK path |
| "Android SDK not found" | ANDROID_HOME incorrect | Set ANDROID_HOME correctly |
| "Build tools not found" | SDK not fully installed | Run SDK Manager to install build-tools |
| "Gradle build hangs" | Gradle daemon stuck | Run `.\gradlew --stop` |
| "Out of memory" | Insufficient RAM for build | Close other apps, increase heap size |
| "APK too large" | Many dependencies included | Check for unused dependencies |

---

## 🎨 Customizing the Build

### Increase Gradle Heap Size (If Build Fails with Memory Error)

**File**: `android/gradle.properties`
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
```

Then retry:
```powershell
.\gradlew clean assembleRelease
```

### Signing APK (For Distribution)

**Only needed for Play Store release. For testing, skip this.**

```powershell
# Generate keystore (one-time)
keytool -genkey -v -keystore release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Answer prompts (password, name, etc.)
# File created: release.keystore
```

### Build with Signing
```powershell
# Edit: android/app/build.gradle
# Add signing config (requires keystore file)

# Then build:
.\gradlew assembleRelease
```

---

## 📚 Quick Command Reference

```powershell
# Navigation
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
cd android

# Prebuild
expo prebuild --clean

# Build Variants
.\gradlew assembleRelease      # Optimized, production APK
.\gradlew assembleDebug        # Fast, debuggable APK

# Cleaning
.\gradlew clean                # Clean build cache
.\gradlew --stop               # Stop Gradle daemon

# Installation
adb devices                    # List connected devices
adb connect 192.168.1.100:5555 # WiFi connection
adb install app-release.apk    # Install APK
adb uninstall com.Kushi_Cabs   # Uninstall app

# Debugging
adb logcat                     # View live logs
adb logcat > logs.txt          # Save logs to file
adb shell pm clear com.Kushi_Cabs  # Clear app cache

# Shortcuts (from unified folder)
.\android\gradlew assembleRelease  # Full path build command
```

---

## 🚀 Complete Workflow Example

```powershell
# 1. Start fresh
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
npm install --legacy-peer-deps

# 2. Generate native project
expo prebuild --clean

# 3. Navigate to android
cd android

# 4. Clean (optional, but safe)
.\gradlew clean

# 5. Build release APK
.\gradlew assembleRelease

# 6. Verify APK created
ls app\build\outputs\apk\release\app-release.apk

# 7. Connect phone and install
adb connect 192.168.1.100:5555
adb devices
adb install app\build\outputs\apk\release\app-release.apk

# 8. Check installation
adb devices  # Should show connected phone
adb shell pm list packages | findstr "Kushi"  # Should show app

# 9. View logs while testing
adb logcat | findstr "Kushi"
```

**Total time: 5-15 minutes (first build) or 2-5 minutes (subsequent)**

---

## ⚡ Performance Tips

### 1. Speed Up Builds
```powershell
# Use offline mode (after first full build)
.\gradlew assembleRelease --offline

# Parallel compilation
.\gradlew assembleRelease --parallel

# Daemon reuse (already default)
# Keep daemon running between builds
```

### 2. Reduce APK Size
Edit `android/app/build.gradle`:
```gradle
splits {
    abi {
        enable true
        reset()
        include 'armeabi-v7a', 'arm64-v8a'
        universalApk false
    }
}
```

Then build separate APKs:
```powershell
.\gradlew assembleRelease
# Creates arm64-v8a and armeabi-v7a APKs
```

### 3. Enable Gradle Caching
```powershell
# Already enabled by default
# Subsequent builds will be much faster
# Build cache location: android\.gradle\
```

---

## 📝 Build Properties Reference

**File**: `android/gradle.properties`

```properties
# Gradle settings
org.gradle.jvmargs=-Xmx2048m

# Build behavior
android.useAndroidX=true
android.enableJetifier=true
android.strictMode=true

# Multidex (if app exceeds 65k methods)
android.multiDex.enabled=true
```

---

## 🎁 What You'll Get

| Output | Size | Location | Use |
|--------|------|----------|-----|
| app-release.apk | 80-120 MB | `android/app/build/outputs/apk/release/` | Testing/Distribution |
| app-debug.apk | 100-150 MB | `android/app/build/outputs/apk/debug/` | Development |

---

## ✅ Final Checklist Before Building

- [ ] Java 17+ installed: `java -version`
- [ ] JAVA_HOME set: `echo $env:JAVA_HOME`
- [ ] Android SDK installed: `ls $env:ANDROID_HOME`
- [ ] Build Tools 35+ installed
- [ ] Node.js v20+ installed: `node --version`
- [ ] npm dependencies installed: `npm install`
- [ ] `.env` file exists with API keys
- [ ] Stable internet connection
- [ ] At least 30 GB free disk space

---

## 🎯 Next Steps

1. **Verify all prerequisites** - Check checklist above
2. **Run prebuild** - `expo prebuild --clean`
3. **Build APK** - `cd android && .\gradlew assembleRelease`
4. **Install on phone** - `adb install app-release.apk`
5. **Test the app** - Open and verify functionality

---

## 📊 Build Summary

**Method**: Gradle (Native Android Build)  
**Speed**: 3-5 minutes (first), 1-2 minutes (subsequent)  
**Output**: `app-release.apk` (~80-120 MB)  
**Testing**: Fully functional production APK  
**Offline capable**: After first full build  

---

## 💡 Key Differences from EAS Build

| Feature | Gradle (Local) | EAS (Cloud) |
|---------|---|---|
| Speed | 3-5 min | 15-30 min |
| Setup time | 30 min | 2 min |
| Infrastructure | Local | Expo servers |
| Offline build | ✅ Yes | ❌ No |
| Customization | ✅ Full | ⚠️ Limited |
| Internet required | ❌ No (after setup) | ✅ Yes |
| Size | 80-120 MB | 80-120 MB |
| Best for | Development | CI/CD |

---

## 📞 Need Help?

**Common resources:**
- Gradle docs: https://gradle.org/releases/
- Android Build: https://developer.android.com/build
- Expo docs: https://docs.expo.dev
- React Native: https://reactnative.dev/docs/environment-setup

**Troubleshooting:**
1. Check logs: `adb logcat | findstr "Kushi"`
2. Clear cache: `npm cache clean --force && .\gradlew clean`
3. Verify setup: Run all checks in Prerequisites section
4. Read error messages carefully - they're usually descriptive

---

**You're ready to build! 🚀**

Start with:
```powershell
cd "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
expo prebuild --clean
cd android
.\gradlew assembleRelease
```

**Estimated total time: 5-15 minutes**

---

**Document Version**: 1.0.0  
**Last Updated**: August 15, 2026  
**For**: Local Gradle native APK builds
