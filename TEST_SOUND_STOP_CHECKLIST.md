# Test Checklist: Sound Should Stop After Accepting Trip

## Setup
- [ ] App reloaded (after code changes applied)
- [ ] Migration 075 already applied to Supabase

## Test Steps

### 1. Create Test Trip (Vendor)
- [ ] Vendor logs in
- [ ] Create a new trip
- [ ] Trip status = pending, is_published = true
- [ ] Wait for sound alert (should hear ringing)

### 2. Accept Trip (Vendor)
- [ ] Click "Accept" on the trip
- [ ] Verify trip status changes to "accepted"
- [ ] Sound should continue (vendor just accepted, not driver)

### 3. Assign to Driver (Vendor)
- [ ] Click "Assign to Driver"
- [ ] Select a driver
- [ ] Verify: trip.driver_id is set
- [ ] Sound should still continue

### 4. **MAIN TEST: Driver Accepts Trip** ⭐
- [ ] Log in as driver
- [ ] Navigate to Dashboard
- [ ] See the vendor-assigned trip
- [ ] Click "Accept Trip" button
- [ ] ⏱️ **TIMER STARTS HERE**

### 5. Verify Sound Stops
- [ ] ⏱️ Count seconds...
- [ ] **Expected**: Sound stops within 1-2 seconds ✅
- [ ] **If not**: Sound still playing after 5 seconds ❌

## What to Look For (Logs)

### GOOD Signs (Sound WILL Stop)
```
✅ Trip accepted successfully
✅ Checking active trips for driver [driver_id]
✅ Active trip FOUND: [trip_id] (status: accepted) - SILENCING ALERTS
✅ AlertContext effect - hasActiveTrip: true, shouldPlayAlert: false
🔇 Sound stopped
```

### BAD Signs (Sound WON'T Stop)
```
✅ Trip accepted successfully
🚗 Checking active trips for driver [driver_id]
🚗 No active trip for driver [driver_id]  ← ❌ PROBLEM
[5 seconds pass]
🔊 [5s interval] Restarting sound loop...  ← Sound restarts
```

## Report Format

Tell me:
1. **Exact time sound stopped** (e.g., "2 seconds", "still playing after 10 seconds")
2. **Copy the last 20 log lines** showing the sequence
3. **Is it restarting every 5 seconds?** (yes/no)

---

## Expected Results by Timeline

| Time | Expected | Actual |
|------|----------|--------|
| 0s | Driver clicks Accept | _____ |
| 0.5s | Trip accepted in DB | _____ |
| 1s | Active trip detected | _____ |
| 1s | Sound stops | _____ |
| 2s | Still stopped (no restart) | _____ |
| 5s | Still stopped (no 5s restart) | _____ |
| 10s | Still stopped | _____ |

---

## Quick Test Commands (Supabase Console)

### Check if trip has driver_id and correct status
```sql
SELECT id, status, driver_id, accepted_by 
FROM trips 
WHERE id = '[trip_id]'
LIMIT 1;
```

Expected:
```
id: [trip_id]
status: accepted
driver_id: [driver_id]
accepted_by: [user_id]
```

### Manually test the query that AlertContext uses
```sql
SELECT id, status 
FROM trips 
WHERE driver_id = '[driver_id]'
AND status IN ('accepted', 'in_progress')
LIMIT 1;
```

Expected: Should find the trip immediately ✅
