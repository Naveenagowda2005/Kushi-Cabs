# Sound Alert Timing Debug Guide

## Problem: Sound Still Playing After Driver Accepts Trip

The sound should stop **immediately** when driver accepts a vendor-assigned trip, but it's still playing.

## Timeline to Check

When the driver accepts a trip, here's the expected timeline:

### T=0ms: Driver Clicks Accept Button
```
LOG: Accept trip clicked...
LOG: acceptTrip() RPC called
```

### T=100-500ms: RPC Returns Successfully
```
LOG: ✅ Trip accepted successfully
LOG: 🔄 useActiveTrip: Fetching active trips...
LOG: 🔄 useActiveTrip: Driver ID: [driver_id]
```

### T=500-1000ms: Active Trip Detected
```
LOG: ✅ useActiveTrip found ACCEPTED trip: [trip_id]
```

### T=1000ms: AlertContext Updates (checkActiveTrip runs)
```
LOG: 🚗 Active trip detected: [trip_id] (accepted) - SILENCE ALERTS
```

### T=1100ms: Alert Stops
```
LOG: 🔇 STOP ALERT TRIGGERED - hasActiveTrip: true
LOG: 🔇 Sound stopped
```

### **EXPECTED TOTAL TIME: 1-2 seconds**

---

## What to Report

When the sound is still playing after accepting, **tell me these timing details**:

1. **How long after accepting?** (e.g., "5 seconds", "10 seconds")
2. **Is the sound continuous or does it restart?** (every 5 seconds)
3. **What do the logs show?** Look for these key logs:
   - ✅ "Trip accepted successfully" - Trip was accepted
   - ✅ "Active trip detected" - AlertContext detected it
   - ✅ "STOP ALERT TRIGGERED" - Sound should have stopped
   - ❌ "Alert already playing, skipping restart" - Sound tried to restart

---

## Most Common Issues & Timing

### Issue 1: Active Trip Not Detected (0s - 5s delay)
**Timeline**: Accept button → 0s (no sound stops) → 5s (background check runs, still no active trip found)

**Logs to look for**:
```
LOG: ✅ Trip accepted successfully
LOG: 🚗 No active trip for driver [driver_id]  ← ⚠️ PROBLEM: useActiveTrip not detecting it
```

**Fix needed**: The trip query is not finding the ACCEPTED trip

### Issue 2: AlertContext Still Has Trips in State (5s - 10s delay)
**Timeline**: Accept button → 0s (sound stops) → 5s (background check runs) → 5s (sound restarts because trips > 0 in state)

**Logs to look for**:
```
LOG: 📊 AlertContext effect - hasActiveTrip: false, shouldPlayAlert: true
LOG: 🔊 [5s interval] Restarting sound loop...
```

**Fix needed**: The `trips` state in AlertContext is not being cleared when driver accepts trip

### Issue 3: Sound Not Stopping After ActiveTrip Detected (1s - 2s delay)
**Timeline**: Accept button → 0s (active trip detected) → 1s (should stop) → 2s (sound still playing)

**Logs to look for**:
```
LOG: 🚗 Active trip detected: [trip_id] (accepted) - SILENCE ALERTS
LOG: 🔇 STOP ALERT TRIGGERED - hasActiveTrip: true
LOG: 🔊 Alert already playing, skipping restart  ← ⚠️ Sound service issue
```

**Fix needed**: soundService.stopSound() is not working properly

---

## How to Get Detailed Logs

1. **Open React Native Debugger** or Expo Go logs
2. **Filter by these keywords**:
   - "Active trip"
   - "STOP ALERT"
   - "Alert already playing"
   - "Sound stopped"

3. **When sound is still playing, copy the last 30 lines of logs**

---

## Expected Log Sequence (GOOD)

```
🔔 Alert available - starting continuous ring
📢 Alert type: trips, rings: 2
▶️ SOUND PLAYING
Accept trip clicked
acceptTrip() RPC called
✅ Trip accepted successfully
🔄 useActiveTrip: Fetching active trips
🔄 useActiveTrip: Driver ID: 18d69f11-2ccc-457b-9ea4-aade9cf878dd
✅ useActiveTrip found ACCEPTED trip: 553d95cc (status: accepted)
🚗 Active trip detected: 553d95cc (accepted) - SILENCE ALERTS
📊 AlertContext effect - hasActiveTrip: true, shouldPlayAlert: false
🔇 STOP ALERT TRIGGERED - hasActiveTrip: true
🔇 Sound stopped
```

---

## Expected Log Sequence (BAD - Still Playing After 5s)

```
🔔 Alert available - starting continuous ring
📢 Alert type: trips, rings: 2
▶️ SOUND PLAYING
Accept trip clicked
acceptTrip() RPC called
✅ Trip accepted successfully
🔄 useActiveTrip: Fetching active trips
🔄 useActiveTrip: Driver ID: 18d69f11-2ccc-457b-9ea4-aade9cf878dd
🚗 No active trip for driver 18d69f11  ← ⚠️ NOT DETECTING ACCEPTED TRIP
[5 seconds pass]
🔊 [5s interval] Restarting sound loop...  ← ⚠️ SOUND RESTARTS
```

---

## When to Tell Me

**Timing to report**:
- ✅ 0-2 seconds: "Sound stopped immediately" - working correctly
- ⚠️ 2-5 seconds: "Sound stopped after a couple seconds" - minor race condition
- ⚠️ 5+ seconds: "Sound didn't stop" - needs investigation
- ❌ Never stops: "Sound keeps playing forever" - critical issue

**Tell me**:
1. Exact timing (e.g., "sound stopped after 3 seconds")
2. Copy the logs showing the sequence
3. Whether it restarts every 5 seconds or just plays once
