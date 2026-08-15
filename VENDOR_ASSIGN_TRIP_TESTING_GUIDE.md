# Testing Guide: Vendor Assign Trip to Driver

## Pre-Test Setup

Ensure you have:
- ✅ Vendor account (logged in as vendor)
- ✅ Driver account (with driver profile)
- ✅ Both accounts verified/approved
- ✅ Migration 074 applied to Supabase

---

## Step-by-Step Testing

### Test 1: Vendor Creates & Accepts Trip

**Vendor App:**
1. Click "Create Trip" or go to Enquiries tab
2. Fill in trip details:
   - Pickup location: e.g., "Bangalore Central"
   - Dropoff location: e.g., "Airport"
   - Fare amount: e.g., 500
   - Scheduled time: Now or future
3. Click "Publish Trip"
4. Trip appears in "Available Trips" (status = pending)
5. Click "Accept Trip"
6. ✅ Trip moves to "My Trips" (status = accepted)

---

### Test 2: Vendor Assigns Trip to Driver

**Vendor App - My Trips Tab:**
1. See accepted trip with "Assign Trip to Driver" button
2. Click button
3. AssignDriverScreen opens showing available drivers
4. ✅ Check drivers list includes your test driver
5. ✅ Check "Vendor Assigned" badge shows on assigned trips (orange)
6. Click on driver to select
7. ✅ Checkmark appears next to driver
8. Click "Assign" button
9. ✅ Confirmation message appears
10. Return to My Trips
11. ✅ Trip still visible in "My Trips" (vendor still owns it)
12. ✅ "Assigned Driver" button shows driver name

---

### Test 3: Driver Sees Assigned Trip on Dashboard

**Driver App - Dashboard:**
1. Go to "Available" tab
2. ✅ Assigned trip appears at TOP of list (priority sorting)
3. ✅ Orange badge shows "👤 Vendor Assigned"
4. ✅ Driver name is NOT visible (passenger details locked)
5. Trip shows:
   - Locations ✅
   - Fare amount ✅
   - Car details ✅
   - But NO passenger name/phone ✅

---

### Test 4: Driver Accepts Trip

**Driver App - Trip Detail Screen:**
1. Click on assigned trip from dashboard
2. TripDetailScreen opens
3. ✅ Shows locations, fare, commission info
4. ✅ Shows "Vendor Assigned" badge
5. Scroll to see "Pay ₹X & Accept Trip" button
6. Click button or "Accept Trip" in alert
7. ✅ NO ERROR ("Trip already accepted or unavailable")
8. ✅ Confirmation alert: "Trip Accepted - Customer details unlocked!"
9. Click "Start Trip" in alert
10. ✅ Navigates to ActiveTrip screen

---

### Test 5: Driver Uploads Start Odometer

**Driver App - ActiveTrip Screen (ACCEPTED Step):**
1. ✅ Should show ACCEPTED step (not IN_PROGRESS)
2. ✅ Shows "Enter starting odometer reading and capture photo"
3. Enter starting KM: e.g., "12500"
4. Click "Capture Odometer Photo"
5. ✅ Camera opens
6. Capture any image
7. ✅ Photo captured confirmation
8. ✅ Checkmark shows on camera button
9. Click "Start Trip" button
10. ✅ Photo uploaded successfully
11. ✅ Status changes to IN_PROGRESS
12. ✅ Navigation map appears

---

### Test 6: Driver Completes Trip

**Driver App - ActiveTrip (IN_PROGRESS Step):**
1. ✅ Navigation map visible
2. Enter ending KM: e.g., "12550"
3. Click "Capture Odometer Photo" (end)
4. Capture any image
5. Click "End Trip"
6. ✅ Payment collection screen appears
7. Enter collection amount or confirm default
8. Click "Yes, Money Collected"
9. ✅ Trip Completed screen appears
10. ✅ Shows earnings amount
11. Click "Back to Dashboard"

---

### Test 7: Verify Commission Deduction

**Vendor App - Wallet:**
1. Go to Wallet/Earnings section
2. ✅ Commission amount deducted after trip completion
3. ✅ Transaction shows trip ID and details

**Driver App - Wallet:**
1. Go to Wallet
2. ✅ Driver earning credited (if configured)
3. ✅ Shows transaction history

---

## Expected Results

### ✅ What Should Happen

| Step | Expected Behavior |
|------|-------------------|
| Vendor accepts trip | Trip moves to "My Trips" |
| Vendor assigns to driver | Trip stays in vendor's "My Trips" |
| Driver sees trip | Appears on dashboard with badge |
| Driver accepts trip | NO ERROR, stays on ActiveTrip |
| Driver uploads odometer | ACCEPTED step visible, photo uploads |
| Driver starts trip | Status → in_progress, map appears |
| Driver completes trip | Commission deducted from vendor |

### ❌ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Trip already accepted" error | Re-apply Migration 074 in Supabase |
| Auto-redirect to navigation | Clear app cache, restart app |
| No odometer upload screen | Check trip status = accepted (not in_progress) |
| Vendor doesn't see assign button | Trip must be in "accepted" status first |
| Driver list is empty | Check drivers table has driver profile |
| Driver name still visible | Clear cache, trip details should be locked until start |

---

## Chrome DevTools Debugging

### Enable console logging to track status changes:

**In ActiveTripScreen, look for logs:**
```
✅ Trip is accepted/in_progress, updating state
🔔 Real-time trip update received: trip_id, status
Active trip found, navigating to ActiveTrip
```

### Check trip status in Supabase:
```sql
SELECT id, status, driver_id, accepted_by, created_at 
FROM trips 
WHERE id = 'trip-id-here'
LIMIT 1;
```

Expected: `status = 'accepted'` after driver accepts (before they click Start Trip)

---

## Performance Checklist

- ⏱️ Trip assignment completes within 2 seconds
- ⏱️ Driver sees trip within 5 seconds (real-time update)
- ⏱️ Odometer photo uploads within 10 seconds
- ⏱️ Trip completion processes within 5 seconds
- ⏱️ Commission deducted automatically

---

## Edge Cases to Test

### Edge Case 1: Multiple Drivers
- Assign same trip to multiple drivers?
  - ✅ Should only work for one (first accept wins)

### Edge Case 2: Trip Cancellation
- Can vendor cancel assigned trip?
  - ✅ Should free driver
  - ✅ Reset to pending

### Edge Case 3: Driver Rejects Trip
- Can driver reject after accepting?
  - ✅ Click "Cancel Trip"
  - ✅ Returns to pending for other drivers

### Edge Case 4: No Commission
- Trip with 0 commission?
  - ✅ Should still work, no payment needed

### Edge Case 5: High Commission
- Commission > fare?
  - ✅ Should show vendor needs to pay driver

---

## Success Criteria ✅

After completing all tests, you should see:

✅ **Vendor workflow works**: Accept → Assign → Commission deducted
✅ **Driver workflow works**: See → Accept → Upload odometer → Complete
✅ **No errors**: No "Trip already accepted" errors
✅ **Correct screens**: ActiveTrip shows odometer step, not navigation
✅ **Real-time sync**: Changes appear immediately on both ends
✅ **Status flow**: pending → accepted → in_progress → completed

---

## Final Sign-Off

When all tests pass:
- [ ] Vendor can create and assign trips
- [ ] Driver sees assigned trips with badge
- [ ] Driver can accept without errors
- [ ] Driver can upload odometer
- [ ] Trip completes successfully
- [ ] Commission deducted automatically

**Status**: ✅ READY FOR PRODUCTION

