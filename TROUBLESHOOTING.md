# Kushi-Cabs Troubleshooting Guide

## Build Issues

### Issue: "npm install fails with dependency errors"

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**
```powershell
# Clear cache
npm cache clean --force

# Install with legacy peer deps (npm 7+)
npm install --legacy-peer-deps

# Or use npm 6 compatible mode
npm config set legacy-peer-deps true
npm install
```

---

### Issue: "Java not found or version incorrect"

**Symptoms:**
```
Error: Java not found in PATH
or
Gradle requires Java 11 or later (found version X.X.X)
```

**Solutions:**
```powershell
# Check Java version
java -version

# If not installed, download from:
# https://www.oracle.com/java/technologies/javase-downloads.html

# Set JAVA_HOME environment variable
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Add to PATH permanently (Windows)
# System Properties > Environment Variables > Add JAVA_HOME
```

---

### Issue: "Android SDK not found"

**Symptoms:**
```
Error: Could not find android.jar
ANDROID_HOME is not set
```

**Solutions:**
```powershell
# Check Android Home
echo $env:ANDROID_HOME

# Set ANDROID_HOME
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"

# Verify installation
sdkmanager --list
sdkmanager --install "platforms;android-34"
sdkmanager --install "build-tools;34.0.0"
```

---

### Issue: "Expo build takes too long or times out"

**Symptoms:**
```
Build cancelled
Timeout waiting for build
```

**Solutions:**
```powershell
# Check build status
eas build --status

# Try building locally instead
npx react-native run-android

# Or use shorter timeout
eas build --platform android --profile production --wait=false
```

---

## APK Installation Issues

### Issue: "APK won't install - App not compatible"

**Symptoms:**
```
Application not installed
INSTALL_FAILED_INVALID_APK
```

**Solutions:**
```powershell
# Check phone's Android version
adb shell getprop ro.build.version.release  # Should be 7.0+

# Check APK architecture
aapt dump badging app.apk | grep abi  # Must match phone's architecture

# Build APK for correct architecture
# arm64-v8a is most common
```

---

### Issue: "Couldn't connect via WiFi ADB"

**Symptoms:**
```
adb: no devices found
unable to connect to 192.168.x.x:5555
```

**Solutions:**

**Step 1: Verify Settings on Phone**
```
Phone > Settings > Developer Options
- USB Debugging: ON ✓
- Wireless Debugging: ON ✓
- IP Address visible ✓
```

**Step 2: Connect via WiFi**
```powershell
# Get phone's IP from Wireless Debugging settings
$PHONE_IP = "192.168.1.100"
$PORT = "5555"

# Connect
adb connect $PHONE_IP:$PORT

# Verify connection
adb devices
# Output should show: 192.168.1.100:5555 connected
```

**Step 3: If still failing**
```powershell
# Restart ADB server
adb kill-server
adb start-server

# Try connecting again
adb connect $PHONE_IP:$PORT

# Check network connectivity
ping $PHONE_IP  # Should respond
```

**Step 4: Factory reset WiFi connection**
- Phone: Settings > Developer Options > Wireless Debugging > Reset
- PC: `adb disconnect`
- Reconnect fresh

---

### Issue: "Permission denied when installing APK"

**Symptoms:**
```
Failure [INSTALL_FAILED_PERMISSION_DENIED]
error: device offline
```

**Solutions:**
```powershell
# Make sure USB Debugging is ON
adb devices  # Should show "device" not "unauthorized"

# Allow USB Debugging on phone popup
# (If asked on phone, tap "Allow")

# Or manually reset:
adb kill-server
adb start-server
adb devices  # Re-authorize if needed
```

---

### Issue: "APK installed but won't start"

**Symptoms:**
```
App crashes immediately
"Unfortunately, Kushi Cabs has stopped"
```

**Solutions:**

**Step 1: Check Logs**
```powershell
adb logcat -c
adb logcat | findstr "Kushi\|ERROR\|CRASH"
```

**Step 2: Common Causes**

| Error in Logs | Fix |
|---------------|-----|
| `SUPABASE_URL not found` | Check .env file, rebuild |
| `Google Maps key invalid` | Verify API key in eas.json |
| `Network error` | Check phone internet connection |
| `Permission denied` | Grant app permissions in Settings |

**Step 3: Clear and Reinstall**
```powershell
# Uninstall
adb uninstall com.Kushi_Cabs

# Clear cache
adb shell pm clear com.Kushi_Cabs

# Reinstall
adb install app-release.apk
```

---

### Issue: "Location/Camera/Storage permissions not working"

**Symptoms:**
```
App asks for permission but crashes
or
Permission always denied
```

**Solutions:**
```powershell
# Grant permissions via adb
adb shell pm grant com.Kushi_Cabs android.permission.ACCESS_FINE_LOCATION
adb shell pm grant com.Kushi_Cabs android.permission.ACCESS_COARSE_LOCATION
adb shell pm grant com.Kushi_Cabs android.permission.CAMERA
adb shell pm grant com.Kushi_Cabs android.permission.READ_EXTERNAL_STORAGE

# Or manually on phone:
# Settings > Apps > Kushi Cabs > Permissions > Grant all
```

---

## Runtime Issues

### Issue: "App can't connect to Supabase"

**Symptoms:**
```
Network request failed
Unable to connect to database
Error: 403 Forbidden
```

**Solutions:**

**Check Environment Variables:**
```powershell
# Verify .env file
Get-Content .env

# Must contain:
# EXPO_PUBLIC_SUPABASE_URL
# EXPO_PUBLIC_SUPABASE_ANON_KEY
```

**Check Network:**
```powershell
# Test connectivity
ping 8.8.8.8        # Google DNS
ping cqfsirfjwfxvwggjkrvd.supabase.co  # Supabase URL

# On phone:
# Settings > WiFi > Connected network > IP address visible
```

**Check API Keys:**
```
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTIyNDAsImV4cCI6MjA5ODgyODI0MH0.BhAbkuYzJ4KEmLM-7ItjaF2WmP4UuSZFqIaZ8ypNBEM
```

**Rebuild:**
```powershell
# Rebuild with fresh env
eas build --platform android --profile production
```

---

### Issue: "Backend API not reachable"

**Symptoms:**
```
POST https://kushi-cabs-27p8.onrender.com failed
SMS not sending
```

**Solutions:**

**Check Backend Status:**
```powershell
# Test endpoint
Invoke-WebRequest -Uri "https://kushi-cabs-27p8.onrender.com/health" -Method GET

# Or from phone:
adb shell "curl https://kushi-cabs-27p8.onrender.com/health"
```

**Update API URL if needed:**
```powershell
# In .env or eas.json
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-27p8.onrender.com

# Rebuild
eas build --platform android --profile production
```

---

### Issue: "OTP not receiving"

**Symptoms:**
```
SMS timeout
"Didn't receive code?" prompt
```

**Solutions:**

**Check SMS Gateway:**
```powershell
# Backend logs show SMS sending attempt
# If not, SMS credentials may be wrong

# In backend .env:
STPL_SMS_USERNAME=correct_username
STPL_SMS_PASSWORD=correct_password

# Restart backend
npm run dev
```

**Check Phone Network:**
- Ensure phone has cellular/internet
- Try different phone network if available
- Check SMS is not filtered

---

### Issue: "Payments (PhonePe) failing"

**Symptoms:**
```
Payment order creation failed
Gateway error 500
```

**Solutions:**

**Verify PhonePe Credentials:**
```powershell
# Backend .env must have:
PHONEPE_MERCHANT_ID=correct_id
PHONEPE_API_KEY=correct_key
PHONEPE_API_URL=https://api.phonepe.com/apis/hermes

# Backend running
npm run dev
```

**Test Payment Flow:**
```powershell
# Create test order
curl -X POST https://kushi-cabs-27p8.onrender.com/api/phonepe/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "amount": 100,
    "currency": "INR"
  }'
```

---

## ADB Debugging

### Useful ADB Commands

```powershell
# List devices
adb devices

# Connect via WiFi
adb connect 192.168.1.100:5555

# Disconnect
adb disconnect 192.168.1.100:5555

# Install app
adb install app-release.apk

# Uninstall app
adb uninstall com.Kushi_Cabs

# Start app
adb shell am start -n com.Kushi_Cabs/.MainActivity

# Stop app
adb shell am force-stop com.Kushi_Cabs

# View logs
adb logcat

# Filter logs
adb logcat | findstr "Kushi"

# Save logs
adb logcat > logs.txt

# Clear logs
adb logcat -c

# Get device info
adb shell getprop

# Push file to phone
adb push file.txt /sdcard/

# Pull file from phone
adb pull /sdcard/file.txt .

# Shell access
adb shell
```

---

## Performance Debugging

### Check App Performance

```powershell
# View memory usage
adb shell dumpsys meminfo com.Kushi_Cabs

# View CPU usage
adb shell top | findstr "Kushi"

# View frame rate
adb shell dumpsys gfxinfo com.Kushi_Cabs

# Monitor frame drops
adb shell dumpsys animation
```

---

## Gradle Issues

### Issue: "Gradle build fails with cryptic error"

**Solutions:**
```powershell
# Clean build files
cd android
./gradlew clean

# Rebuild
./gradlew assembleRelease

# Or with verbose output
./gradlew assembleRelease --stacktrace --debug
```

### Issue: "Out of memory during build"

**Solutions:**
```powershell
# Increase Gradle heap size
# File: android\gradle.properties

org.gradle.jvmargs=-Xmx4096m

# Or via command line
$env:GRADLE_OPTS = "-Xmx4096m"
./gradlew assembleRelease
```

---

## Network & WiFi Issues

### Check WiFi Connection

```powershell
# From phone terminal
adb shell ifconfig wlan0  # Get WiFi IP

# From PC
ipconfig  # Get PC IP

# Both should be on same network (192.168.x.x)
```

### Force WiFi ADB Reconnect

```powershell
# Disconnect all
adb disconnect

# Kill server
adb kill-server

# Start fresh
adb start-server

# Connect with IP:port from phone settings
adb connect 192.168.1.xxx:5555

# Verify
adb devices
```

---

## Clean Build (Nuclear Option)

If all else fails:

```powershell
# Navigate to app
cd "c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\newtaxi\apps\unified"

# Remove all caches
rm -r node_modules
rm package-lock.json
rm -r .expo
cd android
./gradlew clean
cd ..

# Reinstall everything
npm install
npx expo-cli build --platform android --profile production

# This may take 30+ minutes but should resolve most issues
```

---

## Getting Help

If you're still stuck:

1. **Check Project Logs**
   ```
   c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\00_README_PHONEPE_FIX.md
   c:\New folder\Kushi-Cabs-master (1)\Kushi-Cabs-master\00_START_HERE_ODOMETER.md
   ```

2. **Enable Debug Mode**
   ```powershell
   # In app code or settings:
   DEBUG=* npm start
   ```

3. **Check Backend Logs**
   ```
   Render.com > kushi-cabs-27p8 > Logs
   ```

4. **Check Supabase Logs**
   ```
   https://supabase.com > Project > Logs
   ```

---

**Last Updated**: August 15, 2026
**Version**: 1.0.0

