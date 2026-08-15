# Implementation Guide: Floating Trip Bubble (Rapido-style)

## Overview
When a driver exits the app but has an active trip running, a floating bubble should appear on the lock screen showing trip details. This is similar to Rapido's interface.

## What's Been Created

### 1. **floatingBubbleService.js** - Core Background Service
- Location: `src/services/floatingBubbleService.js`
- Handles background task management
- Shows persistent notification while app is in background
- Continues running even if app is closed

### 2. **FloatingTripBubble.js** - UI Component  
- Location: `src/components/FloatingTripBubble.js`
- Elegant animated bubble display
- Shows trip amount, status, and locations
- Pulsing effect to draw attention

## Implementation Steps

### Step 1: Update Notification Permissions in app.json

Add to `app.json` under `android` permissions:

```json
"android": {
  "permissions": [
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.MODIFY_AUDIO_SETTINGS",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.RECEIVE_BOOT_COMPLETED"
  ]
}
```

Also add plugins:
```json
"plugins": [
  [
    "expo-notifications",
    {
      "icon": "./app-icon.png",
      "color": "#ffffff"
    }
  ]
]
```

### Step 2: Install Required Dependencies

```bash
npm install expo-notifications expo-background-fetch expo-task-manager
# or
yarn add expo-notifications expo-background-fetch expo-task-manager
```

### Step 3: Initialize Floating Bubble in App.js

In your root App.js or main navigation file:

```javascript
import { initializeFloatingBubble } from './src/services/floatingBubbleService';

export default function App() {
  useEffect(() => {
    initializeFloatingBubble();
  }, []);
  
  // ... rest of your app
}
```

### Step 4: Show Bubble When Trip Starts

In `DashboardScreen.js` or wherever trip transitions to `in_progress`:

```javascript
import {
  showFloatingBubble,
  hideFloatingBubble,
  setupFloatingBubbleTapHandler,
} from '../../services/floatingBubbleService';

// When trip becomes active
useEffect(() => {
  const manageBubble = async () => {
    if (activeTrip?.status === 'in_progress') {
      console.log('📍 Showing floating bubble');
      await showFloatingBubble(activeTrip);
    } else {
      console.log('📍 Hiding floating bubble');
      await hideFloatingBubble();
    }
  };
  
  manageBubble();
}, [activeTrip]);

// Setup tap handler to bring app to foreground
useEffect(() => {
  const unsubscribe = setupFloatingBubbleTapHandler((tripData) => {
    console.log('👆 User tapped bubble, bring app to foreground');
    navigation.navigate('ActiveTrip', { trip: { id: tripData.tripId } });
  });
  
  return () => unsubscribe?.();
}, [navigation]);
```

### Step 5: Update Bubble During Trip

When trip details update (e.g., fare changes):

```javascript
import { updateFloatingBubble } from '../../services/floatingBubbleService';

// After trip status changes
await updateFloatingBubble({
  id: trip.id,
  fare_amount: updatedFare,
  pickup_location: trip.pickup_location,
  dropoff_location: trip.dropoff_location,
});
```

### Step 6: Hide Bubble When Trip Ends

When trip is completed or cancelled:

```javascript
import { hideFloatingBubble } from '../../services/floatingBubbleService';

// When trip completes
if (trip.status === 'completed') {
  await hideFloatingBubble();
}
```

## How It Works

### Background Task Flow

```
App Running
  ↓
Driver accepts trip → trip.status = 'in_progress'
  ↓
showFloatingBubble() called → stores trip in AsyncStorage
  ↓
Background task wakes up every 30 seconds
  ↓
Checks AsyncStorage for active trip
  ↓
If trip exists → shows persistent notification
  ↓
Notification continues even if app closes
  ↓
User sees floating bubble on lock screen/status bar
  ↓
User taps bubble → app opens to trip details
```

### What the Floating Bubble Shows

**Lock Screen / Status Bar:**
- Title: "🚗 Active Trip"
- Body: "Pickup Location → Dropoff Location"
- Amount: "₹500" (from trip.fare_amount)
- Status: "Tap to view details"

**Visual Design (when visible in-app):**
```
┌─────────────────────┐
│   🚗 TRIP ACTIVE    │
│                     │
│      ₹500           │ ← Shows fare amount
│                     │
│   HOME → OFFICE     │ ← Shows locations on tap
│                     │
└─────────────────────┘
```

## Feature Capabilities

### ✅ What It Does

1. **Persistent Notification** - Shows even if app is closed
2. **Background Monitoring** - Checks for active trips every 30 seconds
3. **Auto-update** - Updates when trip details change
4. **Tap to Bring App** - Tapping bubble brings app to foreground
5. **Multiple Notifications** - Handles different trip states
6. **Graceful Cleanup** - Removes when trip ends
7. **Device Boot** - Restarts on device restart

### ⚙️ Configuration Options

In `floatingBubbleService.js`, you can customize:

```javascript
// Change background task frequency (currently 30 seconds)
minimumInterval: 30,  // seconds

// Change notification content
content: {
  title: '🚗 Active Trip',  // Your custom title
  body: `${trip.pickup_location} → ${trip.dropoff_location}`,
  data: {
    // Custom data passed to handlers
  }
}

// Change position of in-app bubble
<FloatingTripBubble position="bottom-right" />  // or "bottom-left", "top-right", "top-left"
```

## Testing the Feature

### Test 1: Bubble Shows on Trip Start
```
1. Driver accepts a trip
2. Trip status changes to 'in_progress'
3. ✅ Floating bubble appears on screen
4. ✅ Console shows: "📍 Showing floating bubble"
```

### Test 2: Bubble Shows After App Close
```
1. Driver has active trip
2. Close the app (not kill - minimize)
3. Go to lock screen or home screen
4. ✅ Notification with trip info visible
5. ✅ Tap notification → app opens to trip details
```

### Test 3: Bubble Persists on Device Reboot
```
1. Driver has active trip
2. Device restarts
3. ✅ Notification reappears (because background task + AsyncStorage)
4. ✅ No need to open app
```

### Test 4: Bubble Updates on Trip Change
```
1. Trip started, bubble showing
2. Call updateFloatingBubble() with new fare
3. ✅ Notification updates with new amount
```

### Test 5: Bubble Hides on Trip Complete
```
1. Trip in progress, bubble visible
2. Trip marked as 'completed'
3. Call hideFloatingBubble()
4. ✅ Notification disappears
```

## Troubleshooting

### Issue: Notification Not Showing

**Check:**
1. Is `initializeFloatingBubble()` called?
2. Is notification permission granted?
3. Check console for errors

**Debug:**
```javascript
// Add to see if service initializing
console.log('🔍 Checking notification status...');
const status = await Notifications.getPermissionsAsync();
console.log('Notification permissions:', status);
```

### Issue: Notification Shows But No Tap Handler

**Check:**
1. Is `setupFloatingBubbleTapHandler()` called?
2. Is trip data being passed correctly?

**Debug:**
```javascript
// In floatingBubbleService.js, add more logging
.addNotificationResponseReceivedListener((response) => {
  console.log('🎯 Notification response:', response);  // Add this
  // ... rest of handler
})
```

### Issue: Background Task Not Running

**Check:**
1. Background fetch enabled on device?
2. Battery optimization settings
3. App not force-closed

**For Android:**
- Go to Settings → Battery → Battery Saver
- Allow your app to run in background
- Go to Settings → Apps → App Permissions → check all required permissions

### Issue: Notification Not Updating

**Check:**
1. Is `updateFloatingBubble()` being called?
2. Are you passing correct trip object?

**Ensure:**
```javascript
await updateFloatingBubble({
  id: trip.id,              // Required
  fare_amount: trip.fare,   // Make sure this is a number
  pickup_location: trip.pickup,
  dropoff_location: trip.dropoff,
});
```

## Performance Considerations

- **Memory**: Minimal - just stores one trip object
- **Battery**: Minimal - background check every 30 seconds
- **Network**: None - uses local AsyncStorage
- **Disk**: Negligible - ~1KB per notification

## iOS Specific Notes

- Notifications appear in Notification Center
- Tap brings app to foreground
- Background task continues for ~30 minutes after app close (iOS limitation)
- After 30 minutes, iOS may suspend background execution

## Android Specific Notes

- Notifications appear in status bar
- Can be sticky (always visible in status bar)
- Background task can run indefinitely
- Requires `POST_NOTIFICATIONS` permission on Android 13+

## Alternative: Using react-native-floating-bubble

If you want more customization, you can also use:

```bash
npm install react-native-floating-bubble
```

Then replace the notification approach with true floating windows. However, Notifications are simpler and more reliable cross-platform.

## Future Enhancements

1. **Swipe Actions** - Swipe notification to complete/cancel trip
2. **Real-time Location** - Show driver location on lock screen preview
3. **Timer** - Show elapsed time on trip
4. **Audio** - Optional ding sound when notification updates
5. **Custom Animation** - More elaborate pulse/animation effects
6. **Gesture Support** - Drag to custom position
7. **Quick Actions** - Notification action buttons (Complete, Call, etc.)

## Files Provided

✅ `floatingBubbleService.js` - Core service (ready to use)
✅ `FloatingTripBubble.js` - Component (ready to use)
⏳ `DashboardScreen.js` - Needs integration (see Step 4-6 above)
⏳ `app.json` - Needs permissions (see Step 1 above)

## Next Steps

1. Add dependencies: `npm install expo-notifications expo-background-fetch expo-task-manager`
2. Update app.json with permissions and plugins
3. Integrate into DashboardScreen following Steps 4-6
4. Test with all scenarios listed in Testing section
5. Deploy and monitor user feedback

## Questions?

Check console logs for detailed debugging info:
- 🫧 = Floating bubble related
- 🔄 = Background task
- 👆 = Tap handler
- 📍 = Location/bubble show/hide
