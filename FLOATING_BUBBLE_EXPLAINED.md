# 🫧 Floating Bubble Feature - Complete Explanation

## Overview

The floating bubble is a **persistent overlay** that appears on top of your phone's home screen and other apps. It shows real-time trip information (fare, status, location) and can be dragged around or tapped to return to the app.

**Like:** Rapido, Uber's floating notification

---

## How It Works - High Level

```
┌─────────────────────────────────────────────────────┐
│  Your Phone Screen (Any App, Home, Lock Screen)     │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │                                              │   │
│  │  Your Current App / Home Screen              │   │
│  │                                              │   │
│  │                          ┌──────────┐       │   │
│  │                          │  ₹850    │◄─────┼──┼─ Floating Bubble
│  │                          │ ACTIVE   │       │   │ (Always Visible)
│  │                          └──────────┘       │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  User can tap bubble → Returns to Kushi Cabs app   │
│  User can drag bubble → Move it around             │
└─────────────────────────────────────────────────────┘
```

---

## Architecture (3 Layers)

### Layer 1: JavaScript/React (Frontend - `FloatingBubble.js`)

**File:** `src/components/FloatingBubble.js`

**What it does:**
- Renders the UI when app is **open/foreground**
- Shows trip fare, status, location
- Has animations (pulse effect, scale, fade)
- Responds to user taps

**Code:**
```javascript
export default function FloatingBubble({ trip, visible, onPress }) {
  // Fade animation (0 to 1)
  // Scale animation (0.5 to 1)
  // Pulse animation (continuous ring effect)
  
  return (
    <Animated.View>
      {/* Pulsing ring effect */}
      <Animated.View style={[styles.pulseRing, ...]} />
      
      {/* Main bubble */}
      <TouchableOpacity onPress={onPress}>
        <Text>₹{trip.fare_amount}</Text>
        <Text>ACTIVE</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
```

**Limitations:**
- ❌ Only visible when app is in foreground
- ❌ Disappears when user leaves the app

---

### Layer 2: Native Bridge (Android - `FloatingBubbleModule.kt`)

**File:** `android/app/src/main/java/com/Kushi_Cabs/FloatingBubbleModule.kt`

**What it does:**
- Creates a **system-level overlay** window
- Shows bubble **on top of all apps** (including home screen)
- Handles dragging (touch events)
- Communicates with React Native

**Key Components:**

#### A. Window Manager Setup
```kotlin
// TYPE_APPLICATION_OVERLAY = Can appear above other apps
params = WindowManager.LayoutParams().apply {
    type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    width = BUBBLE_SIZE (120 dp)
    height = BUBBLE_SIZE (120 dp)
    x = 100  // Position X
    y = 100  // Position Y
}

windowManager.addView(floatingBubbleView, params)
```

#### B. Touch Handling (Dragging)
```kotlin
floatingBubbleView?.setOnTouchListener { view, event ->
    when (event.action) {
        MotionEvent.ACTION_DOWN -> {
            // Store initial position
            initialX = params.x
            initialY = params.y
            initialTouchX = event.rawX
            initialTouchY = event.rawY
        }
        MotionEvent.ACTION_MOVE -> {
            // Calculate new position based on finger movement
            deltaX = event.rawX - initialTouchX
            deltaY = event.rawY - initialTouchY
            params.x = initialX + deltaX
            params.y = initialY + deltaY
            windowManager.updateViewLayout(view, params)
        }
        MotionEvent.ACTION_UP -> {
            // Send tap event back to React
            sendEventToReact("FloatingBubbleTapped", tripData)
        }
    }
}
```

---

### Layer 3: Package Registration (`FloatingBubblePackage.kt`)

**File:** `android/app/src/main/java/com/Kushi_Cabs/FloatingBubblePackage.kt`

**What it does:**
- Registers the module with React Native
- Creates bridge between JavaScript and native code

**Code:**
```kotlin
class FloatingBubblePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(FloatingBubbleModule(reactContext))
    }
}
```

**Then registered in `MainApplication.kt`:**
```kotlin
override fun getPackages(): List<ReactPackage> {
    return listOf(
        // ... other packages
        FloatingBubblePackage()  // Add our module
    )
}
```

---

## Data Flow (Step by Step)

### Step 1: Trip Started

```
┌─────────────────────────────────────────┐
│ Driver Accepts Trip                      │
│ (Backend API returns trip data)          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ React Native App    │
        │ DriverDashboard     │
        │ Screen              │
        └────────┬────────────┘
                 │
                 │ Has trip data
                 ▼
        ┌─────────────────────────┐
        │ FloatingBubbleContext   │
        │ (Global state)          │
        │ setTrip(tripData)       │
        └────────┬────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
Frontend Component     Native Module
(FloatingBubble.js)   (FloatingBubbleModule.kt)
    │                         │
    │ Call via Bridge         │
    └────────►showFloatingBubble(tripData)
              │
              ▼
        ┌──────────────────────┐
        │ Native Overlay        │
        │ ┌────────────┐       │
        │ │ ₹850       │       │
        │ │ ACTIVE     │       │
        │ └────────────┘       │
        │ Visible on all apps! │
        └──────────────────────┘
```

### Step 2: User Taps Bubble

```
┌──────────────────────┐
│ User taps bubble     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ FloatingBubbleModule.kt       │
│ onTouchListener ACTION_UP     │
│ sendEventToReact(...)         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ React Native receives event   │
│ FloatingBubble tapped!        │
│ onPress() called              │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Navigation.navigate()         │
│ Return to DriverDashboard    │
└──────────────────────────────┘
```

### Step 3: User Drags Bubble

```
┌──────────────────────┐
│ User touches & drags │
│ bubble               │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ FloatingBubbleModule.kt            │
│ MotionEvent.ACTION_MOVE            │
│ Calculate new X, Y position        │
│ windowManager.updateViewLayout()   │
└────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Bubble moves smoothly on screen    │
│ Position persists until trip ends  │
└────────────────────────────────────┘
```

---

## Key Features Explained

### 1. Persistent Overlay
```
✓ Works when app is in background
✓ Works on home screen
✓ Works with other apps open
✓ Appears above lock screen (on Android 10+)
```

**How?** Uses `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`

---

### 2. Real-Time Updates
```
Trip Fare: ₹850 → ₹875 (updated)
Status: PENDING → ACTIVE → COMPLETED

How?
1. Backend sends trip update
2. React component receives update
3. FloatingBubbleModule.updateFloatingBubble() called
4. Native overlay refreshes content
```

---

### 3. Dragging
```
User drags bubble:
  Initial position: X=100, Y=100
  Finger moves: 50px right, 30px down
  New position: X=150, Y=130
  
windowManager.updateViewLayout() updates position
```

---

### 4. Tap Detection
```
User taps → ACTION_UP event
→ sendEventToReact("FloatingBubbleTapped", data)
→ React listener catches event
→ App navigates back to trip details
```

---

## File Structure

```
Floating Bubble Implementation:
│
├─ React Layer (Foreground UI)
│  ├─ src/components/
│  │  ├─ FloatingBubble.js          ← Main component
│  │  ├─ FloatingNotificationBubble.js
│  │  ├─ FloatingTripBubble.js
│  │  └─ TripCountBubble.js
│  ├─ src/context/
│  │  └─ FloatingBubbleContext.js    ← Global state
│  ├─ src/services/
│  │  └─ floatingBubbleService.js    ← API calls
│  └─ src/hooks/
│     └─ useFloatingNotification.js
│
├─ Native Layer (System Overlay)
│  └─ android/app/src/main/java/com/Kushi_Cabs/
│     ├─ FloatingBubbleModule.kt     ← Core logic
│     └─ FloatingBubblePackage.kt    ← Registration
│
└─ Configuration
   ├─ android/app/src/main/AndroidManifest.xml
   │  └─ android.permission.SYSTEM_ALERT_WINDOW
   └─ MainApplication.kt
      └─ FloatingBubblePackage()
```

---

## Permissions Required

### AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

**Why?** Required to draw overlay window above other apps

---

## Lifecycle Diagram

```
┌────────────────────────────────────────────────────┐
│ Trip Lifecycle with Floating Bubble                 │
└────────────────────────────────────────────────────┘

1. TRIP CREATED
   ↓
   → showFloatingBubble() called
   → Native overlay appears
   → ✓ Visible on all screens

2. USER ACCEPTS TRIP
   ↓
   → updateFloatingBubble(newData)
   → Fare, pickup, dropoff updated
   → Bubble shows new info

3. TRIP IN PROGRESS
   ↓
   → Bubble persists
   → User can drag it
   → User can tap it to return to app

4. TRIP COMPLETED
   ↓
   → hideFloatingBubble() called
   → Native overlay removed
   → ✓ Screen clears

5. TRIP CANCELLED
   ↓
   → hideFloatingBubble() called
   → Overlay removed immediately
```

---

## How Dragging Works (Technical Detail)

```
Initial Tap:
  ┌─ Touch point: (300, 400)
  ├─ Bubble center: (200, 300)
  └─ Store initial positions

Moving Finger:
  Loop every 16ms:
    ├─ Current finger: (320, 420)
    ├─ Delta X: 320 - 300 = 20
    ├─ Delta Y: 420 - 400 = 20
    ├─ New bubble X: 200 + 20 = 220
    ├─ New bubble Y: 300 + 20 = 320
    └─ updateViewLayout() refreshes position

Release:
  └─ Send "FloatingBubbleTapped" event back to React
```

---

## Animation Effects

### 1. Fade In/Out
```javascript
Animated.timing(fadeAnim, {
  toValue: visible ? 1 : 0,  // 0 (invisible) to 1 (visible)
  duration: 300,             // 300ms animation
  useNativeDriver: true      // Smooth 60fps animation
})
```

**Result:** Bubble smoothly appears/disappears

### 2. Scale (Pop Effect)
```javascript
Animated.spring(scaleAnim, {
  toValue: visible ? 1 : 0.5,  // 0.5x to 1x size
  friction: 8,                 // Bouncy (like rubber)
  tension: 40,                 // Quick response
})
```

**Result:** Bubble "pops" onto screen

### 3. Pulse Ring
```javascript
Animated.loop(
  Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1, duration: 2000 }),
    Animated.timing(pulseAnim, { toValue: 0, duration: 2000 })
  ])
)
```

**Result:** Continuous pulsing ring effect

---

## Communication Bridge

### JavaScript → Native

```javascript
// In React component
import { NativeModules } from 'react-native';

const { FloatingBubbleModule } = NativeModules;

// Call native function
FloatingBubbleModule.showFloatingBubble(tripData)
  .then(() => console.log('Bubble shown'))
  .catch(err => console.error(err));
```

### Native → JavaScript

```kotlin
// In FloatingBubbleModule.kt
sendEventToReact("FloatingBubbleTapped", tripData)
```

```javascript
// In React component
useEffect(() => {
  const subscription = eventEmitter.addListener(
    'FloatingBubbleTapped',
    (data) => {
      // Handle bubble tap
      navigation.navigate('TripDetails', { tripId: data.trip_id });
    }
  );
  
  return () => subscription.remove();
}, []);
```

---

## Performance Optimization

### 1. Lazy Loading
- Bubble only created when trip starts
- Destroyed when trip ends
- Not loaded if feature disabled

### 2. Efficient Updates
- Only updates changed properties
- Doesn't recreate view unnecessarily
- Uses native layer for smooth performance

### 3. Memory Management
- Single instance per trip
- Cleaned up on app close
- No memory leaks from event listeners

---

## Troubleshooting

### Bubble not appearing?
```
✓ Check SYSTEM_ALERT_WINDOW permission granted
✓ Verify trip data is valid
✓ Check showFloatingBubble() was called
✓ Ensure native module registered in MainApplication
```

### Bubble not draggable?
```
✓ Check touch listener implementation
✓ Verify WindowManager params allow touch
✓ Check onTouchListener is attached to view
```

### Bubble appears then disappears?
```
✓ Check hideFloatingBubble() isn't called immediately
✓ Verify trip lifecycle is correct
✓ Check for auto-cleanup logic
```

### Bubble lag when dragging?
```
✓ Enable useNativeDriver for animations
✓ Reduce bubble complexity
✓ Optimize update frequency
✓ Check for background tasks
```

---

## Real-World Example Flow

### Scenario: Driver Accepts Trip

```
1. Driver taps "Accept Trip" button
   └─ API call: POST /api/trips/accept

2. Backend confirms acceptance
   └─ Response: { trip_id: 123, fare: 850, ... }

3. React receives response
   └─ setTrip(response)

4. FloatingBubbleContext updates
   └─ Calls showFloatingBubble(tripData)

5. Native Module receives call
   └─ Creates overlay window
   └─ Adds bubble to screen

6. User sees bubble on home screen! 🎉
   ├─ Can see: ₹850, ACTIVE status
   ├─ Can drag: Move bubble around
   └─ Can tap: Returns to app for details

7. Trip in progress - real-time updates
   └─ Fare updated: ₹850 → ₹890
   └─ updateFloatingBubble() called
   └─ Bubble instantly shows new fare

8. Driver completes trip
   └─ Trip status: COMPLETED
   └─ hideFloatingBubble() called
   └─ Overlay removed from screen

9. User sees: Final receipt, rating screen
```

---

## Key Takeaways

✅ **Persistent:** Shows on all screens, not just app
✅ **Interactive:** Draggable and tappable
✅ **Real-time:** Updates instantly
✅ **Smooth:** Native animations at 60fps
✅ **Efficient:** Minimal performance impact
✅ **User-friendly:** Improves app engagement

---

## Files Location Reference

```
Project Root:
├─ newtaxi/apps/unified/
│  ├─ src/
│  │  ├─ components/FloatingBubble.js
│  │  ├─ context/FloatingBubbleContext.js
│  │  ├─ services/floatingBubbleService.js
│  │  └─ hooks/useFloatingNotification.js
│  └─ android/app/src/main/java/com/Kushi_Cabs/
│     ├─ FloatingBubbleModule.kt      ← Main logic
│     ├─ FloatingBubblePackage.kt     ← Registration
│     ├─ MainApplication.kt           ← Registers package
│     └─ AndroidManifest.xml          ← Declares permission
```

---

**Now you understand exactly how the floating bubble works!** 🚀

From React animations to native overlays to user interactions - all connected through React Native's bridge!

