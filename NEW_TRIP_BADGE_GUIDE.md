# New Trip Badge - Driver Guide

## What's New?

Drivers now see a **"New Trip"** badge on trip cards that helps them quickly identify newly available trips.

## Visual Appearance

```
┌─────────────────────────────────────────────┐
│ ONE WAY TRIP    [NEW 🌟]    Paid by Cash    │  ← NEW badge appears here
├─────────────────────────────────────────────┤
│ ₹250.00         25 km                        │
├─────────────────────────────────────────────┤
│ 📍 Pickup: MG Road                          │
│ → 🚩 Dropoff: Koramangala                   │
├─────────────────────────────────────────────┤
│ 🚗 Sedan | 👥 4 Seater | ⛽ CNG            │
├─────────────────────────────────────────────┤
│ Toll-Tax-Hills: ✓ Included | Pet: ✗ Not    │
├─────────────────────────────────────────────┤
│ 📅 Departure: Today at 3:00 PM              │
├─────────────────────────────────────────────┤
│ 🔒 Pay commission to unlock details         │
├─────────────────────────────────────────────┤
│ [SKIP]  [ACCEPT TRIP]                       │
└─────────────────────────────────────────────┘
```

## How It Works

### First Time Viewing
- When you open your driver app and new trips are available
- Each new trip shows a bright pink **"New 🌟"** badge
- New trips appear **first** in your list (highest priority)

### Automatic Clearing
- When you go back to the **Available** trips tab
- All trips you were viewing get marked as "seen"
- The badge disappears automatically on your next visit

### Multi-Session
- If you log out and log back in
- New trips that arrived while you were offline show the badge
- Previously seen trips won't show the badge

## Badge Characteristics

| Attribute | Value |
|-----------|-------|
| **Color** | Pink/Magenta (#ff4081) |
| **Icon** | Spark (✨) |
| **Text** | "New" |
| **Position** | Next to trip type |
| **Auto-Clear** | When dashboard tab loads |

## Trip Display Order

Trips are now sorted by importance:

1. 🌟 **New Trips** - Not yet viewed (badge shown)
2. 🔵 **Admin-Assigned** - Directly assigned by super admin
3. 🟠 **Vendor-Assigned** - Assigned by dispatch/vendor
4. ⚪ **Available Trips** - Open for all drivers (sorted by newest)

## Scenario Examples

### Scenario 1: Fresh Notification
```
Time 2:00 PM - You have 2 available trips
- Trip A (NEW) ← Shows NEW badge - newly added
- Trip B      ← No badge - was there earlier

→ You click "Skip" on Trip A
→ You go to "My Trips" tab
→ You come back to "Available" tab
→ Now Trip A also has no badge (you've seen it)
```

### Scenario 2: Long Session
```
Time 2:00 PM - Dashboard shows 3 new trips (all have badges)
Time 2:15 PM - 2 more trips arrive (they have badges)
              Earlier 3 trips still have badges (you haven't left tab)

→ You navigate to trip details
→ You return to Available tab
→ All 5 trips now have no badges (you've seen them all)

Time 2:30 PM - 1 new trip arrives (shows badge)
              Previous 5 trips have no badge
```

### Scenario 3: Multiple Drivers
```
Device: Shared phone used by multiple drivers

Driver A logs in:
- Sees Trip 1, Trip 2, Trip 3 (all show NEW badge)
- Views dashboard for 30 seconds
- Logs out

Driver B logs in:
- Trip 1, Trip 2, Trip 3 still show NEW badge!
- (Independent tracking for each driver)
```

## Important Notes

✅ **Badges persist** - Data is saved locally, survives app restarts
✅ **No internet needed** - Works offline (data syncs when online)
✅ **Fast tracking** - Uses device storage, no server calls
✅ **Automatic** - No manual clearing required
✅ **Per-driver** - Each driver has their own viewing history

## Troubleshooting

### Q: Why isn't the badge disappearing?
A: The badge disappears when you return to the **Available** trips tab after leaving it. Simply navigate to another tab and come back.

### Q: Will the badge show again for old trips?
A: No. Once marked as viewed, a trip only shows the badge again if you:
- Uninstall and reinstall the app
- Clear app data
- Each driver has independent tracking

### Q: What if I want to reset my viewed trips?
A: This requires clearing app data:
1. Go to Settings → Apps → Kushi Cabs
2. Tap "Storage" → "Clear Cache & Data"
3. Reinstall or restart the app

---

**Duration:** Badge appears until you view the Available trips tab again
**Frequency:** Updated each time dashboard is viewed
**Data:** Stored locally on your phone, no server tracking
