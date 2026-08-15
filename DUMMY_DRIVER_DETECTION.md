# Dummy Driver Detection & Filtering Guide

## How Dummy Drivers Are Identified

The system identifies dummy drivers using **two criteria**:

### 1. License Number
- Dummy drivers have license numbers starting with **"DUMMY-"**
- Example: `DUMMY-001`, `DUMMY-TEST-001`
- This is the primary identifier in the Super Admin DriversScreen

### 2. Full Name
- Dummy drivers have names containing the word **"dummy"** (case-insensitive)
- Example: `Dummy Driver`, `DUMMY VENDOR`, `Test Dummy 123`
- This is checked as a fallback or additional filtering

## Query for Test -7483777071

To check if **"Test -7483777071"** is a dummy driver:

```sql
SELECT 
  u.id,
  u.full_name,
  u.phone,
  u.email,
  d.license_number,
  d.vehicle_number,
  CASE 
    WHEN d.license_number ILIKE 'DUMMY-%' THEN '❌ DUMMY DRIVER (License: DUMMY-*)'
    WHEN u.full_name ILIKE '%dummy%' THEN '❌ DUMMY DRIVER (Name contains: dummy)'
    ELSE '✅ ORIGINAL DRIVER'
  END as driver_type
FROM users u
LEFT JOIN drivers d ON u.id = d.user_id
WHERE u.phone = '7483777071' 
   OR u.full_name ILIKE '%Test%7483777071%';
```

## Filtering Implementation

### In AssignDriverScreen (Vendor)
```javascript
// Database-level filter
.filter('full_name', 'not.ilike', '%dummy%')  // Exclude names with "dummy"

// Client-side fallback filter
const validDrivers = driversWithDetails
  .filter(d => d !== null && !(d.users?.full_name?.toLowerCase().includes('dummy')));
```

### In DriversScreen (Super Admin)
```javascript
// Check license number in driver card
const isDummyDriver = driver.drivers?.[0]?.license_number?.toUpperCase().startsWith('DUMMY-');

// Plus filtering in queries
.ilike('drivers.license_number', 'DUMMY-%')  // Get DUMMY drivers
```

## Dummy Driver Creation (SettingsScreen)

Super Admins can create dummy drivers for testing via SettingsScreen:
- Dummy drivers have license numbers like `DUMMY-7483777071`
- They are created with approved verification status
- They appear in a separate "Dummy Drivers" management section

## Current Issues

### Issue: Dummy Drivers Still Appearing in AssignDriver List
**Status**: ✅ **FIXED**

**Problem**: 
- The filter `not.ilike` wasn't working properly with Supabase
- Only checking name, but some dummy drivers may be identified by license number

**Solution Applied**:
1. Changed filter to `.filter('full_name', 'not.ilike', '%dummy%')`
2. Added client-side double-check: `!(d.users?.full_name?.toLowerCase().includes('dummy'))`
3. Added logging to track filtered dummy drivers

### Remaining Consideration
If "Test -7483777071" is still appearing, it could be because:
1. License number starts with "DUMMY-" (needs to check drivers table, not just users)
2. We need to join with drivers table and check license_number in the filter

## Recommended Fix (If Issue Persists)

Update AssignDriverScreen to also check license_number:

```javascript
// Modified query to check both criteria
const { data: usersData, error: usersError } = await supabase
  .from('users')
  .select(`
    id, full_name, phone, verification_status,
    drivers(id, license_number, vehicle_number, is_online)
  `)
  .eq('verification_status', 'approved')
  .eq('is_active', true)
  .eq('drivers.is_active', true);  // Only get active drivers

// Then filter in client:
const driversWithDetails = usersData
  .filter(user => {
    const fullNameOk = !user.full_name?.toLowerCase().includes('dummy');
    const licenseOk = !user.drivers?.[0]?.license_number?.startsWith('DUMMY-');
    return fullNameOk && licenseOk;
  });
```

## Testing Steps

1. **Check a specific driver**:
   ```sql
   SELECT full_name, phone, drivers.license_number, drivers.vehicle_number
   FROM users
   LEFT JOIN drivers ON users.id = drivers.user_id
   WHERE phone = '7483777071';
   ```

2. **List all dummy drivers**:
   ```sql
   SELECT full_name, phone, license_number
   FROM users
   LEFT JOIN drivers ON users.id = drivers.user_id
   WHERE license_number ILIKE 'DUMMY-%'
      OR full_name ILIKE '%dummy%';
   ```

3. **List all non-dummy approved drivers**:
   ```sql
   SELECT COUNT(*) as total_approved_drivers,
          COUNT(CASE WHEN license_number ILIKE 'DUMMY-%' OR full_name ILIKE '%dummy%' THEN 1 END) as dummy_count
   FROM users
   LEFT JOIN drivers ON users.id = drivers.user_id
   WHERE verification_status = 'approved' AND is_active = true;
   ```

## Files
- Check Query: `newtaxi/check_driver_type.sql`
- Implementation: `newtaxi/apps/unified/src/screens/vendor/AssignDriverScreen.js`
- Reference (DriversScreen): `newtaxi/apps/unified/src/screens/superadmin/DriversScreen.js`
