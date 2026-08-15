# 🫧 Floating Bubble - Permission Guide

## Permission Required

The floating bubble needs **one Android permission**:

```
SYSTEM_ALERT_WINDOW (or TYPE_APPLICATION_OVERLAY)
```

This permission allows the app to display a window/overlay on top of other apps.

---

## User Experience Flow

### First App Install

```
STEP 1: User installs Kushi Cabs app
        ↓
STEP 2: User opens app for first time
        ↓
STEP 3: App checks for overlay permission
        ↓
        ┌─────────────────────────────┐
        │ Permission needed!          │
        │                             │
        │ Android will show dialog:   │
        │ "Allow Kushi Cabs to        │
        │  display over other apps?"  │
        │                             │
        │ [Cancel] [Settings]         │
        └─────────────────────────────┘
        ↓
STEP 4: User taps [Settings]
        ↓
STEP 5: Opens Android Settings:
        Settings → Apps → Kushi Cabs
        → Permissions → Display over other apps
        
        Toggle: OFF → ON ✅
        ↓
STEP 6: Returns to app
        Permission granted! ✅
        ↓
STEP 7: User gets active trip
        Floating bubble now works! 🫧
```

---

## Permission Types

| Permission Name | Version | Purpose |
|---|---|---|
| `SYSTEM_ALERT_WINDOW` | Android 5.1+ | Show overlay on top of all apps |
| `SYSTEM_OVERLAY_WINDOW` | Android 7.0+ | Alternative overlay permission |
| `TYPE_APPLICATION_OVERLAY` | Android 8.0+ | Modern overlay window type |

**All three** are handled automatically by the system. The app just needs `SYSTEM_ALERT_WINDOW` in `AndroidManifest.xml`.

---

## Manifest Declaration

Already added in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
```

This tells Android that the app needs this permission.

---

## Permission Check in Code

The `FloatingBubbleNativeModule.kt` has two methods:

### 1. Check Permission

```kotlin
@ReactMethod
fun hasPermission(callback: Callback) {
    val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
        Settings.canDrawOverlays(reactApplicationContext)
    else 
        true  // Pre-Android 6.0 always allowed
    
    callback.invoke(hasPermission)  // Returns: true/false
}
```

### 2. Request Permission

```kotlin
@ReactMethod
fun requestPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        reactApplicationContext.startActivity(
            Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}
```

---

## When Permission is Requested

### Automatic (Recommended)

The app should request permission:
1. **On first launch** - Check if permission exists
2. **When active trip detected** - Before showing bubble
3. **If permission denied** - Request it when trying to show bubble

### Manual (User can do anytime)

User can go to:
```
Android Settings
    → Apps
    → Kushi Cabs
    → Permissions
    → Display over other apps
    → Toggle ON
```

---

## React Native Integration

### Check Permission in JavaScript

```javascript
import { NativeModules } from 'react-native';

const FloatingBubble = NativeModules.FloatingBubble;

// Check if permission is granted
FloatingBubble.hasPermission((hasPermission) => {
  if (hasPermission) {
    console.log('✅ Overlay permission granted!');
  } else {
    console.log('❌ Overlay permission denied');
  }
});
```

### Request Permission in JavaScript

```javascript
// Request permission (opens Settings)
FloatingBubble.requestPermission();
```

### In Your Component

```javascript
import { useEffect } from 'react';
import { NativeModules } from 'react-native';

export default function DashboardScreen() {
  useEffect(() => {
    // Request permission on app start
    const FloatingBubble = NativeModules.FloatingBubble;
    
    FloatingBubble.hasPermission((hasPermission) => {
      if (!hasPermission) {
        console.log('Requesting overlay permission...');
        FloatingBubble.requestPermission();
      }
    });
  }, []);

  // ... rest of component
}
```

---

## Permission Dialog Screenshots

### Android 6.0+ (Modern)

```
User sees this system dialog:

┌──────────────────────────────────────┐
│   Allow Kushi Cabs to display        │
│   over other apps?                   │
│                                      │
│   [Don't allow] [Allow]              │
│                                      │
│   This app is requesting permission  │
│   to draw on your screen over other  │
│   apps.                              │
│                                      │
│   □ Show again in future             │
└──────────────────────────────────────┘

User taps [Allow] → Permission granted ✅
```

### Redirecting to Settings

```
If user denies or if permission not granted:

FloatingBubble.requestPermission()
    ↓
Opens Android Settings with overlay permission page

┌──────────────────────────────────────┐
│  Kushi Cabs                          │
│  ────────────────────────────────────│
│  Permissions                         │
│                                      │
│  Display over other apps             │
│  ❌ OFF → (user taps to toggle)      │
│  ✅ ON                               │
│                                      │
│  ────────────────────────────────────│
│  [Back]                              │
└──────────────────────────────────────┘

User toggles: OFF → ON
Returns to app
Permission now granted ✅
```

---

## Permission States

### State 1: Permission Not Yet Checked

```
First app launch
    ↓
hasPermission() returns: false/undefined
    ↓
Action: Show permission request
```

### State 2: Permission Denied by User

```
User saw dialog and tapped [Don't allow]
    ↓
hasPermission() returns: false
    ↓
Action: Show permission request again (optional)
```

### State 3: Permission Granted

```
User tapped [Allow] or toggled ON in settings
    ↓
hasPermission() returns: true
    ↓
Action: Show floating bubble when app backgrounds ✅
```

### State 4: Permission Revoked

```
User goes to Settings and toggles OFF
    ↓
hasPermission() returns: false
    ↓
Action: Floating bubble won't show (gracefully fail)
```

---

## Best Practice Implementation

```javascript
import { useEffect } from 'react';
import { NativeModules, Alert } from 'react-native';

export default function DashboardScreen({ navigation }) {
  const FloatingBubble = NativeModules.FloatingBubble;

  useEffect(() => {
    // Request permission on component mount
    requestOverlayPermissionIfNeeded();
  }, []);

  const requestOverlayPermissionIfNeeded = async () => {
    try {
      // Check if permission already granted
      FloatingBubble.hasPermission((hasPermission) => {
        if (!hasPermission) {
          console.log('🔔 Requesting overlay permission...');
          
          // Show info to user
          Alert.alert(
            'Permission Required',
            'Kushi Cabs needs permission to show trip notifications over other apps.',
            [
              {
                text: 'Go to Settings',
                onPress: () => FloatingBubble.requestPermission(),
              },
              {
                text: 'Later',
                onPress: () => console.log('Permission requested later'),
              },
            ]
          );
        } else {
          console.log('✅ Overlay permission already granted');
        }
      });
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  // ... rest of component
}
```

---

## Troubleshooting

### "Floating bubble not showing even with active trip"

**Problem**: App goes to background but no bubble appears

**Check 1: Permission granted?**
```javascript
FloatingBubble.hasPermission((has) => console.log('Has permission:', has));
```

**Check 2: Trip status is 'in_progress'?**
```sql
SELECT id, status FROM trips WHERE id = 'trip_id' LIMIT 1;
```

**Check 3: App actually going to background?**
- Check logs: `adb logcat | grep "App went to background"`

**Solution**:
1. Request permission: `FloatingBubble.requestPermission()`
2. Verify trip status in database
3. Make sure app is actually backgrounded (not just minimized)

### "Permission dialog won't go away"

This is normal - it's an Android system behavior. The dialog stays until:
- User taps [Allow] or [Don't allow]
- Or timeout (~30 seconds)

### "Permission was granted but bubble still doesn't show"

Possible causes:
1. Trip status is not 'in_progress'
2. App is not actually backgrounded (still foreground)
3. Native module not properly registered
4. Service not starting

Debug:
```javascript
// Manually test showing bubble
FloatingBubble.show(1, true, JSON.stringify([{
  id: 'test-trip',
  pickup_location: 'Test Start',
  dropoff_location: 'Test End',
  fare_amount: 100,
  status: 'in_progress'
}]));
```

---

## Permission Persistence

Once granted, permission **stays granted** unless:
- User goes to Settings and revokes it manually
- User uninstalls and reinstalls app
- User clears app data

**It is NOT a runtime permission** (unlike Camera, Microphone, Location in modern Android).

---

## For Different Android Versions

| Android Version | Behavior |
|---|---|
| **Android 5.1-5.x** | No special permission (auto-allowed) |
| **Android 6.0-6.x** | Shows permission dialog on first request |
| **Android 7.0-7.x** | Uses overlay permission framework |
| **Android 8.0+** | Uses TYPE_APPLICATION_OVERLAY (modern) |
| **Android 12+** | May have additional restrictions |

The code automatically handles all versions via:
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
    // Use modern permission system
else
    // Permission auto-allowed
```

---

## Summary

✅ **What user needs to do**:
1. Install app
2. When permission dialog appears → Tap [Allow]
3. Or go to Settings → Toggle "Display over other apps" ON

✅ **When permission is needed**:
- First time app launches (check on startup)
- When first active trip appears
- If floating bubble feature used

✅ **What happens next**:
- Permission granted → Floating bubble works! 🫧
- Permission denied → Bubble won't show (graceful failure)
- User can change anytime in Settings

✅ **Automatic in code**:
- App checks permission on startup
- App requests if needed
- FloatingBubble automatically uses permission

---

**User only needs to:** Tap [Allow] when prompted! That's it! ✨

All the permission handling is built into `FloatingBubbleNativeModule.kt`

