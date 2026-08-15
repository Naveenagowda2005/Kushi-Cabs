# Vendor Approval Real-Time Fix

## Problem
When a super admin approved vendor documents in the admin dashboard, the vendor would still see the "Wait for Approval" screen even after login, preventing them from accessing the app.

## Root Cause
The `VendorNavigator` was checking the vendor's verification status only once when the navigator mounted. When the admin approved documents later, the navigator never refreshed to check the updated status, so the vendor remained stuck on the waiting screen even though they were already approved in the database.

## Solution
Added real-time Supabase subscription to `VendorNavigator` to listen for changes to the `vendor_verification_status` table:

### Changes Made
**File: `newtaxi/apps/unified/src/navigation/VendorNavigator.js`**

1. **Added Supabase real-time subscription** after the initial status check:
   ```javascript
   // Subscribe to real-time changes in vendor_verification_status
   const subscription = supabase
     .from('vendor_verification_status')
     .on('*', (payload) => {
       if (isMounted && payload.new?.user_id === user.id) {
         const newStatus = payload.new?.overall_status || 'not_started';
         console.log('VendorNavigator: 🔔 Real-time update received - status is now:', newStatus);
         
         setVerificationStatus((prevStatus) => {
           if (prevStatus !== newStatus) {
             console.log('VendorNavigator: ✅ Status UPDATED from', prevStatus, 'to', newStatus);
           }
           return newStatus;
         });
       }
     })
     .subscribe();
   ```

2. **Added cleanup** to unsubscribe when navigator unmounts:
   ```javascript
   return () => {
     isMounted = false;
     subscription?.unsubscribe();
   };
   ```

## How It Works Now
1. Vendor logs in → Initial status check happens
2. Admin approves vendor's documents in admin dashboard
3. Supabase broadcasts real-time update to all connected clients
4. VendorNavigator receives the update and immediately changes status to 'approved'
5. Navigator automatically switches from "Wait for Approval" screen to vendor dashboard
6. Vendor can now access their dashboard without needing to log out/in

## Benefits
- ✅ Instant verification status updates
- ✅ Vendors see approval immediately after admin action
- ✅ No manual refresh needed
- ✅ Consistent with real-time experience
- ✅ Proper cleanup when component unmounts

## Testing Steps
1. Vendor uploads documents and waits
2. Super admin approves all documents
3. Vendor should immediately see dashboard (no need to refresh or log back in)
4. Check console logs for "Real-time update received" confirmation

## Logs to Check
- `VendorNavigator: 🔔 Real-time update received - status is now: approved`
- `VendorNavigator: ✅ Status UPDATED from pending to approved`
