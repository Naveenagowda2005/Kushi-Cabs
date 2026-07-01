# Admin Trip Creation Feature - Implementation Guide

## Overview
Super admin can now create trips directly and assign them to specific drivers. Only assigned drivers will see these admin-created trips in their available trips list.

## Implementation Details

### 1. Frontend Changes

#### SettingsScreen (Super Admin)
- **Location**: `newtaxi/apps/unified/src/screens/superadmin/SettingsScreen.js`
- **New Section**: "Create Admin Trip" card with purple theme (#9c27b0)
- **Features**:
  - Full trip creation form matching vendor CreateTripScreen fields
  - Trip segment selection (Local, Round trips, Airport)
  - Multi-select driver assignment with checkboxes
  - All trip details: pickup/dropoff, passenger info, vehicle details, commission, etc.
  - Extra charges toggles (Toll-Tax-Hills, Pet Travelling)
  - Special instructions/notes field

#### useTrips Hook
- **Location**: `newtaxi/apps/unified/src/hooks/useTrips.js`
- **Updated**: `useAvailableTrips()` function
- **New Behavior**:
  - Fetches both vendor-published trips AND admin-assigned trips
  - For admin trips: filters by `is_admin_trip = true` and checks if current driver is in `admin_assigned_drivers` array
  - Returns combined list to drivers
  - Logs detailed breakdown: vendor trips + admin trips

### 2. Backend Changes

#### Admin Route Endpoint
- **Location**: `backend/routes/admin.js`
- **New Endpoint**: `POST /admin/create-admin-trip`
- **Parameters**:
  ```json
  {
    "pickupLocation": "string",
    "dropoffLocation": "string",
    "returnLocation": "string (optional, for round trips)",
    "returnDate": "ISO datetime (optional, for round trips)",
    "fixedKm": "number",
    "fareAmount": "number",
    "commissionAmount": "number",
    "customerPreAdvance": "number (optional)",
    "scheduledAt": "ISO datetime",
    "passengerName": "string",
    "passengerPhone": "string",
    "carType": "UUID",
    "carModel": "UUID (optional)",
    "seaterType": "UUID",
    "fuelType": "UUID",
    "segmentId": "UUID",
    "packageId": "UUID (optional)",
    "tollIncluded": "boolean",
    "stateTaxIncluded": "boolean",
    "petTravelling": "boolean",
    "hillsIncluded": "boolean",
    "notes": "string (optional)",
    "createdBy": "UUID (super admin user ID)",
    "assignedDriverIds": ["UUID", "UUID", ...]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Admin trip created and assigned to X driver(s)",
    "trip": {
      "id": "UUID",
      "pickupLocation": "string",
      "dropoffLocation": "string",
      "fareAmount": "number",
      "commissionAmount": "number",
      "passengerName": "string",
      "assignedDrivers": "number"
    }
  }
  ```

### 3. Database Changes

#### New Migration: 069_admin_trip_assignments.sql
- **Table**: `admin_trip_assignments` - tracks admin-to-driver trip assignments
  - `id`: UUID (PK)
  - `trip_id`: UUID (FK to trips)
  - `driver_id`: UUID (FK to users)
  - `assigned_at`: timestamp
  - `assigned_by`: UUID (super admin who created trip)
  - `viewed_at`: timestamp (optional, for tracking engagement)
  - `created_at`: timestamp

- **Trip Table Updates**:
  - `is_admin_trip`: BOOLEAN DEFAULT FALSE
  - `admin_assigned_drivers`: UUID[] (array of driver IDs)

- **RLS Policies**:
  - Super admin can view all assignments
  - Drivers can view their assigned trips
  - Admin can create/update assignments

### 4. Configuration Changes

#### API_CONFIG (Local Backend)
- **File**: `newtaxi/apps/unified/src/constants.js`
- **Change**: Updated from production URL to local backend
  ```javascript
  const getApiUrl = () => {
    const localUrl = 'http://192.168.1.111:5000';
    console.log('Using local API URL:', localUrl);
    return localUrl;
  };
  ```

## How It Works

### Super Admin Creates Trip:
1. Navigate to Settings Screen
2. Click "Create Admin Trip" card to expand
3. Fill in all trip details (same as vendor trip creation)
4. Select one or more drivers from the "Assign Drivers" list
5. Click "Create & Assign Trip" button
6. Trip is sent to backend `/admin/create-admin-trip` endpoint
7. Backend creates trip with:
   - `is_admin_trip = true`
   - `admin_assigned_drivers = [selected driver IDs]`
   - Creates entries in `admin_trip_assignments` table
8. Success alert shows assigned drivers count

### Driver Sees Assigned Trip:
1. Driver opens available trips list (DashboardScreen)
2. `useAvailableTrips()` fetches:
   - Vendor-published trips (as before)
   - Admin-created trips where driver is in `admin_assigned_drivers`
3. Both types appear in the same list
4. Driver can accept and complete like normal trips
5. Only assigned drivers see admin-created trips (others cannot access)

## Testing Steps

### Prerequisites:
1. Backend running: `npm start` in `/backend` folder
2. Frontend running: `npx expo start --clear` in `newtaxi/apps/unified`
3. Local network IP: `192.168.1.111` (update if different)

### Test Scenario:
1. **Login as Super Admin**
   - Open Settings screen
   - Verify "Create Admin Trip" section visible

2. **Create Test Trip**
   - Fill form with test data:
     - Pickup: "Test Pickup"
     - Dropoff: "Test Dropoff"
     - Fixed KM: "50"
     - Amount: "500"
     - Commission: "100"
     - Passenger: "Test User"
     - Phone: "9876543210"
   - Select Trip Segment: "Local Packages" or similar
   - Select Car Type, Seater Type, Fuel Type
   - **Assign 1-2 test drivers**
   - Click "Create & Assign Trip"

3. **Check Backend Logs**
   - Should see: "📝 Creating admin trip..."
   - Should see: "✅ Admin trip created: [trip_id]"
   - Should see: "✅ Trip assignments saved for X driver(s)"

4. **Verify as Driver**
   - Login as assigned driver (different account)
   - Go to Dashboard/Available Trips
   - Admin-created trip should appear in list
   - Non-assigned drivers should NOT see it

5. **Check Database**
   - Query `trips` table: verify `is_admin_trip = true`
   - Query `admin_trip_assignments`: verify entries created
   - Check `admin_assigned_drivers` array contains correct driver IDs

## API Integration Summary

### Endpoints Used:
- **Frontend → Backend**: `POST http://192.168.1.111:5000/admin/create-admin-trip`
- **Frontend → Supabase**: Direct queries for trips with admin filtering

### Database Tables:
- `trips` (updated with admin fields)
- `admin_trip_assignments` (new)
- `admin_trip_assignments` (RLS policies for access control)

### Real-time Updates:
- Drivers see admin trips immediately through `useAvailableTrips()`
- No additional webhooks/subscriptions needed for initial release

## Known Limitations / Future Enhancements

1. **Date Picker**: Return date picker not implemented yet (placeholder shows date as text)
2. **Car Models**: Car model selection works but optional
3. **Trip Cancellation**: Admins cannot cancel trips after creation yet
4. **Batch Assignment**: Can assign to multiple drivers but no bulk edit
5. **View Admin Trips**: No admin dashboard to see created trips (can use EnquiriesScreen)

## Troubleshooting

### Issue: "Failed to create trip"
- Check backend is running: `npm start` in `/backend`
- Check network IP is correct (192.168.1.111)
- Check backend logs for error details
- Verify all required fields are filled

### Issue: Drivers not seeing assigned trips
- Verify driver is actually selected in UI (checkbox shows)
- Check `admin_assigned_drivers` array in trips table
- Verify driver ID matches exactly (case-sensitive UUID)
- Force refresh driver app or sign out/in

### Issue: "admin_trip_assignments table doesn't exist"
- Run migration: `069_admin_trip_assignments.sql` in Supabase
- Or create table manually using SQL from migration file

## Migration Steps

1. **Run Database Migration**:
   - Execute `newtaxi/supabase/migrations/069_admin_trip_assignments.sql`
   - Verify tables created with `SELECT * FROM admin_trip_assignments LIMIT 0;`

2. **Deploy Backend**:
   - Update backend with new `/admin/create-admin-trip` route
   - Restart backend: `npm start`

3. **Deploy Frontend**:
   - Update SettingsScreen component
   - Update useTrips hook
   - Update API_CONFIG to local URL
   - Test in development first

4. **Test End-to-End**:
   - Follow testing steps above
   - Verify both super admin and driver flows

## Files Modified/Created

### Created:
- `newtaxi/supabase/migrations/069_admin_trip_assignments.sql`
- `ADMIN_TRIP_CREATION_GUIDE.md` (this file)

### Modified:
- `newtaxi/apps/unified/src/screens/superadmin/SettingsScreen.js`
- `newtaxi/apps/unified/src/hooks/useTrips.js`
- `newtaxi/apps/unified/src/constants.js` (API_CONFIG to local URL)
- `backend/routes/admin.js` (new endpoint added)

---

**Status**: ✅ Complete Implementation Ready for Testing
**Backend URL**: http://192.168.1.111:5000 (local)
**Next Step**: Run migration + test scenario
