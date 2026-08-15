# Driver Dashboard - Sound Alert Only on Trip Count Increase

## Problem
Sound was playing 3 times when:
- No trips available (count = 0)
- Trip count stayed the same
- On every app load/refresh
- Not specific to when trips increased

## Root Cause
There was no mechanism to detect **when the trip count changed**. Sound alerts were either:
- Not triggered at all
- Or triggered for every state update regardless of actual change

## Solution Implemented

### Modified `DashboardScreen.js`

**1. Added sound service import:**
```javascript
import { playLoopingAlert } from '../../services/soundService';
```

**2. Added state tracking for trip count changes:**
```javascript
// Track previous trip count to detect when count increases
const prevTripCountRef = useRef(0);
const hasPlayedInitialSoundRef = useRef(false);
```

**3. Added sound trigger effect:**
```javascript
// 🔊 Play sound alert only when trip count INCREASES
useEffect(() => {
  const currentTripCount = displayTrips.length;
  const previousTripCount = prevTripCountRef.current;

  console.log(`📊 Trip count change: ${previousTripCount} → ${currentTripCount}`);

  // Only play sound if:
  // 1. Trips increased (new trips available)
  // 2. Driver is online
  // 3. Not the initial load (prevents sound on app start)
  if (
    currentTripCount > previousTripCount &&
    isOnline &&
    hasPlayedInitialSoundRef.current
  ) {
    const newTripsCount = currentTripCount - previousTripCount;
    console.log(`🔊 Playing sound alert: ${newTripsCount} new trip(s) available`);
    playLoopingAlert(3); // Play 3 times
  }

  // Mark that we've processed at least one count change
  if (!hasPlayedInitialSoundRef.current && currentTripCount >= 0) {
    hasPlayedInitialSoundRef.current = true;
    console.log('✅ Initial trip count loaded, sound alerts now enabled');
  }

  // Update previous count for next comparison
  prevTripCountRef.current = currentTripCount;
}, [displayTrips.length, isOnline]);
```

## How It Works Now

### Scenario 1: Initial App Load
- First load: 5 trips available
- Previous count: 0, Current count: 5
- **Sound**: ❌ NO (initial load suppressed by `hasPlayedInitialSoundRef`)
- Effect: Sound disabled for initial load, state marked as ready

### Scenario 2: New Trip Arrives
- Current trips: 5, New trip arrives: +1
- Previous count: 5, Current count: 6
- **Sound**: ✅ YES (5 < 6 && isOnline && hasPlayedInitialSoundRef)
- Effect: Plays 3 beeps, updates reference

### Scenario 3: Trip Count Decreases (driver accepts trip)
- Driver accepts trip from 6 available
- Previous count: 6, Current count: 5
- **Sound**: ❌ NO (5 is not > 6)
- Effect: No sound when trips decrease

### Scenario 4: Count Stays Same
- 5 trips, no changes
- Previous count: 5, Current count: 5
- **Sound**: ❌ NO (5 is not > 5)
- Effect: No unnecessary sound

### Scenario 5: Driver Goes Offline
- Driver toggles offline while 6 trips available
- **Sound**: ❌ NO (isOnline = false)
- Effect: No sound alerts when driver is offline

## Sound Alert Rules

✅ **Sound WILL play when:**
- Trip count increases (e.g., 5 → 6)
- Driver is online
- App has completed initial load
- Multiple new trips can trigger multiple sounds (e.g., 5 → 8 plays sound once)

❌ **Sound WON'T play when:**
- Initial app load (first fetch)
- Trip count decreases (driver accepts/skips trips)
- Trip count stays the same
- Driver is offline
- Every 30-second auto-refetch (only if count actually changes)

## Console Logs for Debugging

The fix includes helpful console logs:
```
📊 Trip count change: 0 → 5        // Shows every comparison
✅ Initial trip count loaded       // Signals ready state
🔊 Playing sound alert: 1 new trip // Confirms sound plays
```

## Files Modified
- `newtaxi/apps/unified/src/screens/driver/DashboardScreen.js`

## Testing Checklist
- [ ] App load: No sound on startup
- [ ] Driver is online, 0 trips available: No sound
- [ ] 1 new trip arrives (0 → 1): Sound plays ✓
- [ ] More trips arrive (1 → 3): Sound plays ✓
- [ ] Driver accepts trip (3 → 2): No sound
- [ ] Driver goes offline: No more sounds
- [ ] Driver goes online again: Sound plays for new trips
- [ ] Wait for auto-refetch (30s): Only sounds if count increases

---

**Status**: ✅ Complete and Ready for Testing
**Impact**: Sound alerts now only play when trips actually increase
