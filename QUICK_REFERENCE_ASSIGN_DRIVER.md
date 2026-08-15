# Quick Reference: AssignDriver Screen

## How to Use

### For Vendors
1. Accept a trip → Trip appears in "My Trips" tab
2. Click "Assign Trip to Driver" button on trip card
3. Select a driver from the list (tap the card)
4. Click "Assign to [Driver Name]" button
5. Confirm the assignment
6. Trip status changes to IN_PROGRESS

### For Debugging

**Check if "Test -7483777071" is dummy**:
```sql
SELECT full_name, license_number, 
  CASE WHEN license_number ILIKE 'DUMMY-%' THEN '❌ DUMMY' 
       WHEN full_name ILIKE '%dummy%' THEN '❌ DUMMY' 
       ELSE '✅ REAL' END
FROM users LEFT JOIN drivers ON users.id = drivers.user_id
WHERE phone = '7483777071';
```

**Check console logs** (F12 in browser):
- Look for: `✅ Loaded X drivers (filtered Y dummy drivers)`
- Should NOT see "Test -7483777071" if it's dummy

**Fix photo loading** if photos don't appear:
1. Check driver has DRIVER_SELFIE document:
   ```sql
   SELECT * FROM driver_documents 
   WHERE driver_id = '{user_id}' AND document_type = 'DRIVER_SELFIE';
   ```
2. If empty, driver needs to upload selfie in verification
3. Check console for error messages

## Filtering Rules

**Dummy drivers are excluded if**:
1. License number starts with `DUMMY-` OR
2. Full name contains `dummy` (any case)

**Example dummy drivers**:
- License: `DUMMY-7483777071` → ❌ EXCLUDED
- Name: `Dummy Driver` → ❌ EXCLUDED  
- Name: `Test Dummy 123` → ❌ EXCLUDED

**Example real drivers**:
- License: `KA05AB1234` → ✅ INCLUDED
- Name: `John Smith` → ✅ INCLUDED

## Key Files

| File | Purpose |
|------|---------|
| `AssignDriverScreen.js` | Main driver list UI |
| `VendorNavigator.js` | Screen routing |
| `EnquiriesScreen.js` | MyTripCard button |
| `check_driver_type.sql` | Verify driver type |

## Photos

- **Source**: `driver_documents` table
- **Document Type**: `DRIVER_SELFIE`
- **Data Column**: `document_data` (base64 or data URL)
- **Format**: Converted to `data:image/jpeg;base64,{data}`
- **Fallback**: Blue person icon

## Issues & Solutions

| Issue | Solution |
|-------|----------|
| Dummy drivers showing | Check license/name filtering in SQL |
| Photos not loading | Verify DRIVER_SELFIE document exists |
| Drivers not appearing | Check verification_status = 'approved' |
| Search not working | Check search terms match exact values |
| Button not visible | Check trip status is 'accepted' or 'in_progress' |

## Console Commands

```javascript
// Check drivers loaded
console.log(drivers);

// Check photo URL
console.log(drivers[0]?.photo_url);

// Search for dummy
drivers.filter(d => d.users?.full_name?.toLowerCase().includes('dummy'));
```

## Navigation Flow

```
EnquiriesScreen (My Trips)
    ↓
MyTripCard (Trip card for accepted trip)
    ↓
"Assign Trip to Driver" button
    ↓
AssignDriverScreen
    ↓
Select Driver → Assign Button
    ↓
Trip updated to IN_PROGRESS
    ↓
Back to EnquiriesScreen
```

## Performance Tips

1. First load fetches ~100 drivers max with photos (API calls)
2. Search runs client-side (instant)
3. Photos cached in data URLs (no re-fetching)
4. Consider pagination if > 200 drivers in future

## Testing Scenarios

### Scenario 1: Real Driver
1. Use driver with real license number (not DUMMY-)
2. Full name doesn't contain "dummy"
3. DRIVER_SELFIE document uploaded
4. Should see: Photo + name + status badges

### Scenario 2: Dummy Driver
1. License: `DUMMY-7483777071`
2. Should NOT appear in list
3. Console shows: "filtered X dummy drivers"

### Scenario 3: No Photo
1. Real driver without DRIVER_SELFIE document
2. Should see: Placeholder blue icon + name + status badges
3. Console shows: "⚠️ No DRIVER_SELFIE document found"

---

**Last Updated**: July 3, 2026
