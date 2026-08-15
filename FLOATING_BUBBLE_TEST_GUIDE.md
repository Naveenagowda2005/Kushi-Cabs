# Floating Bubble - Testing & Build Guide

## 🏗️ BUILD INSTRUCTIONS

### Step 1: Navigate to Project
```bash
cd c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified
```

### Step 2: Clean and Prebuild
```bash
npm run prebuild --clean
# or
npx expo prebuild --clean
```

### Step 3: Build Release APK
```bash
cd android
./gradlew assembleRelease
```

**APK Location:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 📱 INSTALLATION ON PHONE

### Over Network (Recommended)
```bash
# In one terminal, start adb network mode
adb tcpip 5555

# Connect to phone IP (192.168.1.104:37861948432)
adb connect 192.168.1.104:37861948432

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via USB Cable
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 🧪 TESTING CHECKLIST

### ✅ Step 1: Permissions
- [ ] Launch app
- [ ] Go to background
- [ ] System dialog: "Allow Kushi Cabs to appear on top of other apps?"
- [ ] Tap **[Allow]**
- [ ] Permission persists for future use

### ✅ Step 2: Bubble Visibility
- [ ] Open app with active trip (trip.status = 'in_progress')
- [ ] Go to background (press home button)
- [ ] Bubble should appear at TOP-RIGHT corner
- [ ] Circle is white, 360×360px
- [ ] "Kushi Cabs" text is blue and centered
- [ ] Blue pulsing radar animation visible in background
- [ ] Red badge showing trip count at top-right

### ✅ Step 3: Sound & Vibration
- [ ] New trip arrives (trip count increases from 1 → 2)
- [ ] **ring.mp3** sound plays
- [ ] Phone vibrates: 50ms + 100ms + 50ms pattern
- [ ] Badge animates (scales 1.3x then back to 1.0x)
- [ ] Count updates to "2"

### ✅ Step 4: Dropdown Menu
- [ ] Bubble is visible in background
- [ ] Tap on bubble circle
- [ ] Dropdown menu appears below bubble
- [ ] White background with rounded appearance
- [ ] Shows "Active Trip" header in blue
- [ ] Displays:
  - [ ] 📍 Pickup: [location]
  - [ ] 📍 Dropoff: [location]
  - [ ] 💵 Fare: $[amount] (in red)
  - [ ] Status: [in_progress] (in green)
- [ ] Light gray divider lines between items
- [ ] Tap bubble again to close dropdown

### ✅ Step 5: Open App on Click
- [ ] Dropdown menu open
- [ ] Tap on bubble circle again
- [ ] Wait 300ms
- [ ] App opens (MainActivity launches)
- [ ] Bubble disappears automatically
- [ ] Trip details visible in app

### ✅ Step 6: Hide on Foreground
- [ ] App is open and visible
- [ ] Bubble should NOT be visible on screen
- [ ] Status bar notification: "Kushi Cabs - Trip in progress..."
- [ ] Go to background
- [ ] Bubble reappears at TOP-RIGHT

### ✅ Step 7: Hide on Status Change
- [ ] Bubble visible with active trip
- [ ] Trip status changes (e.g., cancelled, completed)
- [ ] Bubble disappears
- [ ] Cannot reappear until next in_progress trip

---

## 🎨 VISUAL VERIFICATION

### Circle UI
- [ ] Position: TOP-RIGHT corner, 20px from edges
- [ ] Size: 360×360px
- [ ] Background: White (#FFFFFF)
- [ ] Text: "Kushi Cabs" in blue (#0066CC), bold, centered

### Radar Animation
- [ ] 3 concentric blue circles (#0066CC)
- [ ] Pulsing effect (smooth expansion & fade)
- [ ] Continuous animation (1.5s cycle)
- [ ] Center dot (blue, 6px)

### Badge
- [ ] Size: 56×56px
- [ ] Position: TOP-RIGHT of circle (16px margins)
- [ ] Background: Red (#FF6B6B)
- [ ] Text: White, bold, centered
- [ ] Shows current trip count

### Dropdown
- [ ] Width: 560px
- [ ] Background: White
- [ ] Position: Below bubble, aligned right
- [ ] Padding: 12px all sides
- [ ] Text color: Dark gray (#333333)
- [ ] Dividers: Light gray (#EEEEEE), 1px height

---

## 🔊 SOUND VERIFICATION

### ring.mp3 Location
```
android/app/src/main/res/raw/ring.mp3
```

### Sound Triggers
- ✅ On trip count increase (e.g., 1 → 2)
- ✅ App in background or closed
- ✅ Trip status = 'in_progress'
- ✅ Custom audio plays, not system sound

### Sound Properties
- Custom file: ring.mp3
- Fallback: System notification sound
- Volume: Device media volume
- Duration: Custom (typical 2-5 seconds)

---

## 📊 LOG MONITORING

### View Android Logs
```bash
adb logcat | grep FloatingBubble
```

### Expected Logs
```
FloatingBubbleService: Bubble view added at TOP-RIGHT (20px from edges)
FloatingBubbleService: Trip count changed: 1 -> 2
FloatingBubbleService: ring.mp3 notification sound played
FloatingBubbleService: Vibration triggered (50ms + 100ms + 50ms)
FloatingBubbleService: Dropdown opened
FloatingBubbleService: App opened - MainActivity launched
FloatingBubbleService: Bubble removed
```

### React Native Logs
```javascript
// Expected console output
🫧 Requesting overlay permission...
🫧 App went to background - showing bubble
🫧 Trip count changed: 1 -> 2
🫧 Showing floating bubble for trip: {trip_id}
🫧 App came to foreground - hiding bubble
```

---

## ⚠️ TROUBLESHOOTING

### Bubble Not Appearing
1. Check permission: Settings → Apps → Kushi Cabs → Permissions → **"Appear on top of other apps"**
2. Verify trip.status === 'in_progress'
3. Confirm app is in background (inactive/background state)
4. Check logs: `adb logcat | grep FloatingBubble`

### Sound Not Playing
1. Verify ring.mp3 exists: `android/app/src/main/res/raw/ring.mp3`
2. Check device volume is not muted
3. Check logs for "ring.mp3 notification sound played"
4. Test fallback: Should play system notification if custom fails

### Vibration Not Triggering
1. Verify device has vibrator: Settings → About Phone → scroll down
2. Check vibration is enabled in app settings
3. Enable vibration in system: Settings → Sound & Vibration
4. Check logs for "Vibration triggered"

### Dropdown Not Showing Data
1. Verify trip details passed from React: Check logs for "Updating bubble"
2. Confirm pickup_location, dropoff_location, fare_amount fields exist
3. Check FloatingBubbleModule.showBubble() receives all fields
4. Restart app and test again

### App Not Opening on Click
1. Verify FloatingBubbleService has MainActivity imported
2. Check MainActivity is exported in AndroidManifest.xml
3. Verify click detection: 200ms threshold, <50px movement
4. Check logs for "App opened - MainActivity launched"

---

## 📋 CHECKLIST FOR PRODUCTION

- [ ] APK builds without errors
- [ ] APK installs successfully
- [ ] All permissions granted
- [ ] Bubble appears when app backgrounded
- [ ] Bubble has correct UI (circle, text, badge, animation)
- [ ] Dropdown shows trip details correctly
- [ ] Sound plays on trip count increase
- [ ] Vibration pattern triggers
- [ ] App opens when bubble clicked
- [ ] Bubble hides when app foregrounded
- [ ] Colors match specification
- [ ] Position is TOP-RIGHT at 20px edges
- [ ] No crashes in logs
- [ ] Performance is smooth

---

**Build Date:** August 15, 2026  
**Status:** ✅ Ready for Release Testing
