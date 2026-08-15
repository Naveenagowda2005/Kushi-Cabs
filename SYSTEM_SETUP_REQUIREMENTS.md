# Kushi-Cabs System Setup & Requirements

## Complete Environment Setup Guide

---

## System Requirements

### Minimum Hardware
| Component | Requirement | Notes |
|-----------|-------------|-------|
| **CPU** | Dual-core 2.5+ GHz | Build times with single core: 2+ hours |
| **RAM** | 8 GB | 16+ GB recommended for smooth development |
| **Storage** | 20+ GB free | Android SDK: 8-10 GB, Gradle cache: 5 GB |
| **Network** | Broadband (5+ Mbps) | For downloading dependencies |

### Supported Operating Systems
- ✅ **Windows 10/11** (64-bit only)
- ✅ **macOS 11+** (for iOS builds)
- ✅ **Linux** (Ubuntu 18+)

### Phone Requirements
- **Android Version**: 7.0+ (API 24+)
- **Minimum RAM**: 2 GB
- **Storage**: 200+ MB free
- **WiFi**: Connected to same network as PC

---

## Step 1: Install Java Development Kit

### Option A: Oracle JDK (Official)

1. Download JDK 21 LTS
   - Visit: https://www.oracle.com/java/technologies/javase-jdk21-downloads.html
   - Choose: Windows x64 Installer (.exe)
   - File size: ~180 MB

2. Run installer
   - Double-click the .exe file
   - Accept license
   - Install to default location: `C:\Program Files\Java\jdk-21`
   - Install JRE when prompted

3. Verify installation
   ```powershell
   java -version
   # Expected output:
   # java version "21.0.x"
   # Java Runtime Environment (build 21.0.x+...)
   # Java HotSpot(TM) 64-Bit Server VM (build 21.0.x+...)
   ```

### Option B: OpenJDK (Free Alternative)

1. Download from: https://adoptium.net/temurin/releases/
2. Choose: JDK 21 LTS, Windows, x64
3. Install normally
4. Same verification as above

### Option C: Using Chocolatey

```powershell
# If you have Chocolatey installed
choco install openjdk21

# Verify
java -version
```

### Set JAVA_HOME Environment Variable

**Method 1: Persistent (Recommended)**
1. Open **Start Menu** > Type "Environment Variables"
2. Click **"Edit the system environment variables"**
3. Click **"Environment Variables"** button
4. Under **System variables**, click **"New"**
5. Variable name: `JAVA_HOME`
6. Variable value: `C:\Program Files\Java\jdk-21`
7. Click OK three times
8. **Restart PowerShell/Terminal** to apply

**Method 2: Temporary (Current Session Only)**
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
# Only applies to current PowerShell session
```

**Verify it worked:**
```powershell
$env:JAVA_HOME  # Should show path
java -version    # Should work
```

---

## Step 2: Install Android SDK

### Option A: Android Studio (Recommended)

1. **Download Android Studio**
   - Visit: https://developer.android.com/studio
   - Click "Download" button
   - File size: ~1.2 GB

2. **Install**
   - Run installer (.exe)
   - Choose installation location (default: `C:\Users\YourName\AppData\Local\Android\Sdk`)
   - Next > Install
   - Launch Android Studio when complete

3. **Configure SDK**
   - Android Studio opens "Setup Wizard"
   - Click "Next" > "Next"
   - Select "Standard" installation
   - Accept license agreement
   - Let it download SDK components (5-10 minutes)

4. **Install Additional Components**
   - Open Android Studio
   - Go: **Tools > SDK Manager**
   - Check **SDK Platforms** tab:
     - ✅ Android 14 (API 34) - Latest
     - ✅ Android 13 (API 33)
     - ✅ Android 7 (API 24) - Minimum
   - Check **SDK Tools** tab:
     - ✅ Android SDK Build-Tools 34.0.0+
     - ✅ Android Emulator
     - ✅ NDK (r21 or later)
     - ✅ Android SDK Platform-Tools
   - Click "Apply" > "OK"
   - Wait for download/installation

5. **Find SDK Location**
   - In SDK Manager bottom: Shows path like `C:\Users\YourName\AppData\Local\Android\Sdk`
   - **Copy this path** for next step

### Option B: Command-Line Tools (Minimal)

1. Download from: https://developer.android.com/studio/command-line/sdkmanager
2. Extract to: `C:\Android\cmdline-tools\latest`
3. Set up SDK path (see next section)

### Set ANDROID_HOME Variable

1. Open **Environment Variables** (like Java setup)
2. Add **New System Variable**:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YourName\AppData\Local\Android\Sdk` (or your path)
3. Click OK, **Restart PowerShell**

**Verify:**
```powershell
$env:ANDROID_HOME           # Should show path
sdkmanager --list           # Should list SDK packages
```

### Install Required SDK Packages

```powershell
# Verify path is set
$env:ANDROID_HOME

# Install platforms
sdkmanager "platforms;android-34"
sdkmanager "platforms;android-33"
sdkmanager "platforms;android-24"

# Install build tools
sdkmanager "build-tools;34.0.0"

# Install other essentials
sdkmanager "platform-tools"
sdkmanager "emulator"
sdkmanager "ndk;25.1.8937393"  # or newer
```

---

## Step 3: Install Node.js & npm

### Already Installed ✓
```powershell
node --version    # v24.13.0 ✓
npm --version     # 11.6.2 ✓
```

**If not installed:**

1. Download from: https://nodejs.org/en/
2. Choose **LTS version** (not Current)
3. Run installer
4. Use default options
5. Verify:
   ```powershell
   node --version
   npm --version
   ```

### Update npm (Optional)

```powershell
npm install -g npm@latest
```

---

## Step 4: Install Global Development Tools

### Install Expo CLI

```powershell
npm install -g expo-cli
```

**Verify:**
```powershell
expo --version        # Should show 55.x or higher
expo whoami            # Shows logged-in account (if any)
```

### Install EAS CLI (Expo Build Service)

```powershell
npm install -g eas-cli
```

**Verify:**
```powershell
eas --version         # Should show 12.x or higher
eas whoami            # Shows Expo account
```

### Install React Native CLI (Optional)

```powershell
npm install -g react-native-cli
```

### Install TypeScript (Optional but Recommended)

```powershell
npm install -g typescript
```

---

## Step 5: Clone/Setup Kushi-Cabs Project

### Navigate to Project

```powershell
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master"
```

### Install Project Dependencies

```powershell
# Navigate to app directory
cd newtaxi\apps\unified

# Install npm packages
npm install

# Expected output:
# added 500+ packages in 45 seconds
```

**If you get peer dependency warnings:**
```powershell
npm install --legacy-peer-deps
```

### Verify Installation

```powershell
npm list | head -20   # Shows installed packages
ls node_modules       # Should have 500+ folders
```

---

## Step 6: Configure Environment Variables

### Create .env File

Create file: `newtaxi/apps/unified/.env`

**Content:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTIyNDAsImV4cCI6MjA5ODgyODI0MH0.BhAbkuYzJ4KEmLM-7ItjaF2WmP4UuSZFqIaZ8ypNBEM
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-27p8.onrender.com
```

**Verify:**
```powershell
Test-Path .env              # Should be True
Get-Content .env            # Shows file content
```

---

## Step 7: Configure Phone for WiFi ADB

### Enable Developer Mode

1. Open **Settings** app on phone
2. Scroll down > Tap **About Phone**
3. Scroll down > Tap **Build Number** 7 times rapidly
   - After 3 taps: "You're getting close..."
   - After 7 taps: "You are now a developer!"
4. Go back to main Settings
5. New option **"Developer Options"** appears

### Enable Wireless Debugging

1. In Settings, find **Developer Options** (or **System Settings > Developer Options**)
2. Scroll down and enable:
   - ✅ **Developer Options** (toggle on)
   - ✅ **USB Debugging** (toggle on)
   - ✅ **Wireless Debugging** (toggle on) - Android 11+ only

### Note WiFi Connection Details

1. In **Developer Options** > **Wireless Debugging**
2. Note the **IP address** and **Port** (typically 5555)
   - Example: `192.168.1.100:5555`
3. **Keep Developer Options open** during installation

---

## Step 8: Setup Git (Optional)

### Download & Install

1. Visit: https://git-scm.com/download/win
2. Download latest version
3. Run installer, use default options

### Verify

```powershell
git --version   # Should show git version
```

### Configure Git (First time)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.autocrlf true  # For Windows
```

---

## Step 9: Setup IDE/Editor (Recommended)

### Option A: Visual Studio Code (Free, Recommended)

1. Download: https://code.visualstudio.com/
2. Install normally
3. Install Extensions:
   - **React Native Tools** (Microsoft)
   - **Prettier - Code formatter**
   - **ES7+ React/Redux/React-Native snippets**
   - **Android iOS Debugger**

### Option B: Android Studio (Heavy but Complete)

Already setup in Step 2

### Option C: WebStorm (Paid)

- Download: https://www.jetbrains.com/webstorm/
- 30-day free trial
- Full React Native support

---

## Verification Checklist

Run this verification script:

```powershell
# Save as verify-setup.ps1

echo "=== Java Setup ==="
java -version

echo "`n=== Android SDK ==="
$env:ANDROID_HOME
sdkmanager --list | head -5

echo "`n=== Node & npm ==="
node --version
npm --version

echo "`n=== Expo ==="
expo --version
eas --version

echo "`n=== Project ==="
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"
npm list | head -3
Test-Path .env

echo "`n=== All systems ready! ==="
```

**Run:**
```powershell
.\verify-setup.ps1
```

---

## Disk Space Breakdown

| Component | Size |
|-----------|------|
| Java JDK | 200 MB |
| Android SDK | 8-10 GB |
| Android Emulator | 2-3 GB (optional) |
| Node modules (project) | 1.5 GB |
| Gradle cache | 3-5 GB |
| APK builds | 500 MB - 1 GB |
| **Total** | **~16 GB minimum** |

---

## Network Requirements

### Bandwidth

| Activity | Data | Time |
|----------|------|------|
| Initial setup | 8-10 GB | 30-60 min @ 3 Mbps |
| npm install | 500 MB | 5-10 min |
| APK build | 1-2 GB | 10-20 min |
| APK install (WiFi) | 100 MB | 1-2 min |

### Firewall/Proxy

If behind corporate firewall:

```powershell
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Configure Gradle proxy
# File: android/gradle.properties
systemProp.http.proxyHost=proxy.company.com
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=proxy.company.com
systemProp.https.proxyPort=8080
```

---

## Troubleshooting Initial Setup

### Problem: "npm install fails"

```powershell
# Solution 1: Clear cache
npm cache clean --force

# Solution 2: Use legacy peer deps
npm install --legacy-peer-deps

# Solution 3: Delete and retry
rm -r node_modules
rm package-lock.json
npm install
```

### Problem: "Java not found"

```powershell
# Check Java installed
where java

# If nothing, reinstall Java
# Set JAVA_HOME manually:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Verify
java -version
```

### Problem: "Android SDK tools not found"

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME

# If empty, set it:
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"

# Install SDK
sdkmanager "build-tools;34.0.0"
sdkmanager "platforms;android-34"
```

---

## Quick Commands Reference

```powershell
# Navigate to project
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"

# Install dependencies
npm install

# Start Expo (dev mode)
npm start

# Build APK
eas build --platform android --profile production

# WiFi ADB
adb connect 192.168.1.100:5555
adb install app-release.apk

# View logs
adb logcat | findstr "Kushi"
```

---

## Performance Optimization

### Faster Builds

```powershell
# Enable Gradle daemon
$env:GRADLE_OPTS = "-Xmx4096m"

# Enable parallel build
# File: android/gradle.properties
org.gradle.parallel=true
org.gradle.workers.max=8

# Enable build cache
org.gradle.caching=true
```

### Faster Installs

- Use WiFi ADB (faster than USB)
- Install on modern phone (Android 11+)
- Clear app cache before install: `adb shell pm clear com.Kushi_Cabs`

---

## Keep System Updated

```powershell
# Update npm
npm install -g npm@latest

# Update Expo
npm install -g expo-cli@latest

# Update EAS
npm install -g eas-cli@latest

# Update Android Studio
# Open Android Studio > Help > Check for Updates
```

---

## Next Steps

1. ✅ Complete all steps above
2. ✅ Run verification script
3. 📱 Follow: **APK_BUILD_WIFI_INSTALLATION_GUIDE.md**
4. 🐛 If issues: See **TROUBLESHOOTING.md**

---

**Last Updated**: August 15, 2026
**Version**: 1.0.0
**Project**: Kushi-Cabs

