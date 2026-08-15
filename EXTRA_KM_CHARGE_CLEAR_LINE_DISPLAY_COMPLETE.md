# Extra KM Charge - Clear Line Display - ✅ Complete

## Changes Made

### 1. **Driver Available Trips Card** (TripCard.js)
   - File: `newtaxi/apps/unified/src/components/TripCard.js`
   - Extra KM charge now displays on a **separate, dedicated line**
   - Shows clearly below the Fare & Fixed KM row

### 2. **Vendor Available Trips Card** (EnquiryCard.js)
   - File: `newtaxi/apps/unified/src/components/EnquiryCard.js`
   - Extra KM charge now displays on a **separate, dedicated line**
   - Shows clearly below the Fare & Fixed KM row

---

## Display Format

### Each Card Now Shows:

```
┌─────────────────────────────────────────────┐
│ Trip Type Badge          Payment Method     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ₹Fare Amount  │  Fixed KM km          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ↗ Extra Charge per KM:    ₹10/km      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Pickup → Dropoff → Return (if applicable) │
└─────────────────────────────────────────────┘
```

---

## Styling Details

### Extra KM Charge Row Styling:
- **Background**: Light Orange (#fff3e0)
- **Border**: Left border (4px) in Orange (#ff9800)
- **Icon**: Trending-up icon with Orange color
- **Label**: "Extra Charge per KM:" in dark gray
- **Value**: Amount in Orange with bold font
- **Padding**: 12px horizontal, 8px vertical
- **Margin**: 8px bottom spacing

### Visual Components:
- **Icon**: trending-up-outline in orange
- **Label Text**: "Extra Charge per KM:" (gray)
- **Amount**: "₹10/km" (orange, bold)
- **Only Shows**: When value exists and is > 0

---

## Code Implementation

### TripCard (Driver Available Trips):
```javascript
{trip.extra_km_charge && trip.extra_km_charge > 0 && (
  <View style={styles.extraKmChargeRow}>
    <Ionicons name="trending-up-outline" size={14} color="#ff9800" />
    <Text style={styles.extraKmChargeLabel}>Extra Charge per KM:</Text>
    <Text style={styles.extraKmChargeValue}>₹{trip.extra_km_charge}/km</Text>
  </View>
)}
```

### EnquiryCard (Vendor Available Trips):
```javascript
{trip.extra_km_charge && trip.extra_km_charge > 0 && (
  <View style={styles.extraKmChargeRow}>
    <Ionicons name="trending-up-outline" size={14} color="#ff9800" />
    <Text style={styles.extraKmChargeLabel}>Extra Charge per KM:</Text>
    <Text style={styles.extraKmChargeValue}>₹{trip.extra_km_charge}/km</Text>
  </View>
)}
```

---

## Files Modified

1. `newtaxi/apps/unified/src/components/TripCard.js`
2. `newtaxi/apps/unified/src/components/EnquiryCard.js`

---

## Conditional Display

The extra KM charge line only displays when:
- `trip.extra_km_charge` field exists
- Value is greater than 0

This prevents clutter when no extra charge is configured.

---

## Database Prerequisites

Ensure migration `071_add_extra_km_charge_to_trips.sql` has been applied to the database for this feature to work.

---

**Status**: ✅ Complete - Clear line display for extra KM charges on both driver and vendor trip cards
