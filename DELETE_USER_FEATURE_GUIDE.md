# Delete User Feature - Complete Guide

## Overview
Super admin can now delete drivers and vendors, but the system prevents deletion if they have pending trips.

---

## How It Works

### Step 1: Admin clicks Delete Button
- Go to Drivers or Vendors tab in Admin Dashboard
- Click the red "Delete" button on any user card

### Step 2: Confirmation Alert
```
Delete Driver
Are you sure? This cannot be undone.

[Cancel] [Delete]
```

### Step 3: Backend Validation
The backend checks for pending trips:
- Trips where `created_by = user_id`
- Trips where `assigned_driver_id = user_id`
- Statuses checked: `pending`, `accepted`, `in_progress`, `awaiting_payment`

### Step 4: Result

#### If User Has Pending Trips ❌
```
Cannot Delete Driver

This user has 2 incomplete trip(s). 
Please complete or cancel all trips 
before deleting this account.

Pending Trips: 2
Statuses: pending, in_progress
```
👉 User is NOT deleted

#### If User Has No Pending Trips ✅
```
Success

Driver deleted successfully
```
✅ User is deleted from:
- Supabase Auth
- Users table
- Driver/Vendor profiles
- Documents
- Verification status
- Wallet & transactions

---

## Pending Trip Statuses

| Status | Allows Delete? | Reason |
|--------|---|---------|
| `pending` | ❌ No | Trip not yet accepted |
| `accepted` | ❌ No | Driver accepted, not started |
| `in_progress` | ❌ No | Trip currently active |
| `awaiting_payment` | ❌ No | Payment pending |
| `completed` | ✅ Yes | Trip fully finished |
| `cancelled` | ✅ Yes | Trip was cancelled |

---

## Testing

### Test Case 1: Delete User with Pending Trips
```
1. Create a test driver
2. Get driver approved
3. Create a trip but leave it in "pending" status
4. Try to delete the driver
5. ✅ Expect: Alert shows "cannot delete"
6. Driver should still exist in database
```

### Test Case 2: Delete User with No Pending Trips
```
1. Create a test driver
2. Get driver approved
3. Create and complete a trip
4. Try to delete the driver
5. ✅ Expect: Successful deletion
6. Driver should be removed from database
```

### Test Case 3: Delete User with Multiple Pending Trips
```
1. Create a test driver
2. Create multiple trips in different statuses
3. Try to delete the driver
4. ✅ Expect: Alert shows count of ALL pending trips
5. Statuses should include all non-completed ones
```

---

## API Response Examples

### Request
```bash
curl -X POST http://192.168.1.114:4000/admin/delete-user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "75f834a1-4251-4630-b70e-df40d36ec781",
    "email": "9686314982@kushicabs.phone"
  }'
```

### Response: Success (No Pending Trips)
```json
{
  "success": true,
  "message": "User deleted successfully",
  "deleted": {
    "auth": true,
    "database": true,
    "related": {
      "documents": true,
      "verification": true,
      "vendor": true,
      "driver": true
    }
  }
}
```

### Response: Error (Pending Trips Found)
```json
{
  "success": false,
  "error": "Cannot delete user with pending trips",
  "message": "This user has 2 incomplete trip(s). Please complete or cancel all trips before deleting this account.",
  "pendingTripsCount": 2,
  "tripStatuses": ["pending", "in_progress"]
}
```

### Response: Error (Other Reasons)
```json
{
  "success": false,
  "error": "Failed to delete user",
  "message": "Invalid userId or other error"
}
```

---

## Frontend Changes

### DriversScreen.js
- Now calls `POST /admin/delete-user` instead of direct DB delete
- Handles `pendingTripsCount` in response
- Shows detailed alert with trip count and statuses

### VendorsScreen.js
- Same implementation as DriversScreen
- Applies to vendors as well

### Error Message Format
```javascript
Alert.alert(
  'Cannot Delete Driver/Vendor',
  `${result.message}\n\nPending Trips: ${result.pendingTripsCount}\nStatuses: ${result.tripStatuses?.join(', ')}`
);
```

---

## Backend Implementation

### File: `backend/routes/admin.js`

**New Step 0: Trip Validation**
```javascript
// Check for trips created by this user
const { data: createdTrips } = await supabaseAdmin
  .from('trips')
  .select('id, status, created_by')
  .eq('created_by', userId);

// Check for trips assigned to this user (as driver)
const { data: acceptedTrips } = await supabaseAdmin
  .from('trips')
  .select('id, status, assigned_driver_id')
  .eq('assigned_driver_id', userId);

// Filter for pending statuses
const pendingTrips = [...createdTrips, ...acceptedTrips]
  .filter(trip => ['pending', 'accepted', 'in_progress', 'awaiting_payment'].includes(trip.status));

// Reject if pending trips exist
if (pendingTrips.length > 0) {
  return res.status(400).json({
    success: false,
    error: 'Cannot delete user with pending trips',
    message: `This user has ${pendingTrips.length} incomplete trip(s)...`,
    pendingTripsCount: pendingTrips.length,
    tripStatuses: [...new Set(pendingTrips.map(t => t.status))]
  });
}
```

---

## Troubleshooting

### Issue: "Cannot delete user" error but no pending trips visible
- **Solution**: Check trip statuses in database directly
- **Query**: 
  ```sql
  SELECT id, status, created_by, assigned_driver_id 
  FROM trips 
  WHERE created_by = 'user-id' OR assigned_driver_id = 'user-id'
  AND status NOT IN ('completed', 'cancelled');
  ```

### Issue: Delete button not working
- **Check**: Backend is running at `http://192.168.1.114:4000`
- **Check**: Frontend can reach backend (no network errors in console)
- **Check**: User has valid `userId` and `email`

### Issue: Frontend shows generic error instead of trip alert
- **Cause**: API response format doesn't match expected schema
- **Solution**: Check `result.pendingTripsCount` exists in response
- **Debug**: Log `result` object to see actual response format

---

## Workflow Example

### Complete User Deletion Process
```
1. Admin navigates to Drivers tab
2. Admin sees list of drivers
3. Admin clicks Delete on "John Doe" (driverId: ABC-123)
4. Confirmation appears: "Delete Driver - Are you sure?"
5. Admin clicks Delete

BACKEND:
6. Receives: POST /admin/delete-user { userId: ABC-123 }
7. Queries trips where created_by OR assigned_driver_id = ABC-123
8. Finds 1 trip with status = "in_progress"
9. Returns: { error: "Cannot delete...", pendingTripsCount: 1, ... }

FRONTEND:
10. Receives error response (status 400)
11. Checks: result.pendingTripsCount > 0
12. Shows: "Cannot Delete Driver - This user has 1 incomplete trip(s)..."
13. Shows in alert: "Pending Trips: 1, Statuses: in_progress"
14. Admin dismisses alert

NEXT:
15. Admin completes the pending trip
16. Admin tries delete again
17. Backend finds NO pending trips
18. Proceeds with deletion in 3 steps:
    a) Delete from auth.users
    b) Delete from users table
    c) Delete related records (documents, verification, etc.)
19. Returns: { success: true, message: "User deleted successfully" }
20. Frontend shows: "Success - Driver deleted successfully"
21. UI refreshes and shows updated driver list (John Doe gone)
```

---

## Implementation Summary

| Component | Change | Impact |
|-----------|--------|--------|
| Backend API | Added trip validation check | Prevents orphaned trip records |
| Frontend | Calls API instead of direct DB | Better error handling |
| User Experience | Clear, actionable alerts | Admin knows why deletion failed |
| Data Integrity | Validates before deletion | Maintains referential integrity |

---

## Status: ✅ READY FOR PRODUCTION

All components tested and working:
- ✅ Backend validation implemented
- ✅ Frontend UI updated
- ✅ Error handling added
- ✅ Servers running
- ✅ Ready for user testing
