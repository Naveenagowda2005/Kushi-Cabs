# Camera Capture Troubleshooting Guide

## Issue: Failed to Open Camera to Capture Image

### What I Fixed
Enhanced error handling and logging in the camera capture function with detailed error messages and troubleshooting options.

### Common Causes & Solutions

#### 1. **Camera Permission Not Granted**
**What to do:**
- The app will now show: "Camera permission is needed to capture odometer images"
- Tap "Open Settings" to enable camera permission
- Or manually go to: Settings → App Permissions → Camera → Allow

**To verify permission:**
- Check Android: Settings > Apps > [App Name] > Permissions > Camera
- Check iOS: Settings > [App Name] > Camera

---

#### 2. **Another App is Using the Camera**
**Solution:**
- Close all other apps that might be using the camera
- Check if any video call or camera app is open
- Restart the app and try again

---

#### 3. **Device Camera Hardware Issue**
**Symptoms:**
- Error persists even with permissions granted
- Camera works in other apps

**Solutions:**
- Restart your device
- Clear app cache: Settings > Apps > [App Name] > Storage > Clear Cache
- Reinstall the app if issue persists

---

#### 4. **iOS Specific Issues**
If on iOS and camera won't open:
- Ensure app is not in restricted mode
- Check iOS Settings > Screen Time > Content & Privacy Restrictions
- Make sure camera is not disabled in restricted app list

---

### What the App Now Does

When you tap "Capture Odometer Photo":

1. **Requests permission** → Shows status in logs (📸 prefix)
2. **Launches camera** → Shows "Camera" in logs
3. **Captures image** → Shows URI and file info in logs
4. **Stores image** → Ready for trip upload

### Debug Information (In Console Logs)

Look for these logs to diagnose issues:
```
📸 Starting camera capture for: start
📸 Requesting camera permissions...
📸 Camera permission status: granted
📸 Launching camera...
📸 Camera result: {canceled: false, assetsCount: 1}
📸 Image captured successfully: {...}
```

---

### If Problem Persists

**Step 1:** Check the console logs (📸 prefix) - they now show detailed error info

**Step 2:** Take note of:
- Permission status
- Error message if any
- Device type (Android/iOS)

**Step 3:** Try these basic steps:
- ✅ Go online first (driver status should be "Online")
- ✅ Ensure good lighting for odometer photo
- ✅ Make sure camera lens is clean
- ✅ Close background apps
- ✅ Restart device if needed

**Step 4:** If still failing:
- Reinstall app
- Clear app cache and data
- Try with different device if available

---

### What Information to Share if Reporting Issue

When reporting camera capture failure, provide:
1. Device type and OS version
2. Error message shown in alert
3. Console logs (if accessible)
4. Whether other camera apps work
5. Exact steps you took before error occurred

---

## Technical Details for Developers

The camera capture function now includes:
- ✅ Detailed error logging with 📸 prefix
- ✅ Asset validation (checks if assets array exists)
- ✅ Permission status checking
- ✅ User-friendly error messages
- ✅ Option to open device settings
- ✅ Comprehensive stack trace in logs

