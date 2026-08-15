# App Configuration for Play Store Publishing

## Current app.json (Updated)

Your app.json has been updated for Play Store publishing:

```json
{
  "expo": {
    "name": "Kushi Cabs Unified",
    "slug": "kushicabs-unified",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "config": {
        "googleMapsApiKey": "YOUR_IOS_GOOGLE_MAPS_KEY"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.kushicabs.unified",
      "versionCode": 1,
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyAGZ5ps5kpMnfbDPox8kuN4IoWMSO0TeAY"
        }
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Kushi Cabs to use your location for navigation and trip tracking.",
          "locationWhenInUsePermission": "Allow Kushi Cabs to use your location for navigation."
        }
      ]
    ],
    "permissions": [
      "LOCATION",
      "CAMERA",
      "MEDIA_LIBRARY"
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

## Before Building - Check These

1. **Package Name:** `com.kushicabs.unified`
   - Must be unique (not used by any other app)
   - Cannot be changed after first submission

2. **Version Number:** `1.0.0`
   - Format: MAJOR.MINOR.PATCH
   - For next update: 1.0.1, 1.1.0, etc.

3. **Icons & Images:**
   - ✅ Icon (192x192px) at `./assets/icon.png`
   - ✅ Splash screen (1242x2436px) at `./assets/splash.png`
   - ✅ Adaptive icon (108x108px foreground) at `./assets/adaptive-icon.png`

4. **Permissions Check:**
   - LOCATION - for map & trip tracking ✅
   - CAMERA - for odometer photos ✅
   - MEDIA_LIBRARY - for image upload ✅

## Build Commands

### Option 1: EAS Build (Recommended - Easiest)
```bash
# First time setup
eas build --platform android --profile preview

# For production (Play Store)
eas build --platform android --profile production
```

### Option 2: Local Build (If you have Android SDK)
```bash
# Create local build
expo build:android

# Or with expo-go
expo export:android
```

## Play Store Package Name
```
com.kushicabs.unified
```

Keep this exact - it identifies your app uniquely!

## Next Build Update Version Numbers

When you release updates:
- Patch (bug fixes): 1.0.1, 1.0.2
- Minor (features): 1.1.0, 1.2.0
- Major (redesign): 2.0.0

Also update version code: 1 → 2 → 3 (sequential numbers)

