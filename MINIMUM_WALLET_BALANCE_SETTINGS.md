# Minimum Wallet Balance Settings Feature

## Overview
Super Admin can now configure the minimum wallet balance required for drivers through the Settings screen. This setting is centrally managed and automatically applies to all drivers across the system.

## What Was Implemented

### 1. **Database Migration** 
- **File**: `supabase/migrations/067_add_minimum_wallet_balance_setting.sql`
- **Changes**:
  - Added `minimum_wallet_balance_for_drivers` column to `app_settings` table (NUMERIC, default 500)
  - Updated existing 'global' row with default value ₹500
  - Added RLS policies to allow authenticated users to read, but only super admins to update
  - Default value: ₹500

### 2. **Frontend Hook**
- **File**: `src/hooks/useSystemSettings.js`
- **Functionality**:
  - `useSystemSettings()`: Fetches system settings including minimum wallet balance
  - Queries `app_settings` table with `id = 'global'`
  - `updateMinimumWalletBalance()`: Updates the setting from super admin dashboard
  - Automatic caching with fallback to default if fetch fails
  - Returns: `{ settings, loading, error, refetch }`

### 3. **Super Admin Settings Screen**
- **File**: `src/screens/superadmin/SettingsScreen.js`
- **New Section**: "Minimum Wallet Balance"
  - Displays current minimum balance with wallet icon
  - Edit button to modify the setting
  - Input field for entering new amount
  - Save/Cancel buttons
  - Success alert on update

### 4. **Driver Wallet Screen**
- **File**: `src/screens/driver/WalletScreen.js`
- **Changes**:
  - Now fetches minimum balance from app_settings instead of hardcoded constant
  - Dynamic warning message shows current minimum requirement
  - Format: "Minimum balance required: ₹{dynamicValue}"
  - Updates in real-time if admin changes the setting

### 5. **Driver Trip Detail Screen**
- **File**: `src/screens/driver/TripDetailScreen.js`
- **Changes**:
  - Uses dynamic minimum wallet balance when checking trip acceptance eligibility
  - Updated all alert messages to show actual minimum (not hardcoded)
  - Warning shows exact amount needed: "Need ₹{amount} more"

## User Flow

### For Super Admin:
1. Navigate to **Settings** tab in Super Admin Dashboard
2. Scroll to **"Minimum Wallet Balance"** section
3. Click **Edit** (pencil icon)
4. Enter new minimum amount (e.g., 300, 1000, etc.)
5. Click **Save**
6. Confirmation alert shows update was successful
7. All drivers immediately see the new requirement

### For Drivers:
1. Open **Wallet** screen
2. See current minimum balance requirement
3. If balance is low, warning shows: "Minimum balance required: ₹{amount}"
4. Add funds via "Add Funds" button to meet requirement
5. Minimum balance requirement automatically enforced when accepting trips

## Technical Details

### Data Flow:
```
Super Admin Settings → app_settings table → useSystemSettings hook → Driver screens
```

### Database Schema:
```sql
ALTER TABLE app_settings 
ADD COLUMN minimum_wallet_balance_for_drivers NUMERIC DEFAULT 500 NOT NULL;
```

### Key Features:
- ✅ Centralized management (single source of truth in app_settings)
- ✅ Real-time updates (drivers see changes immediately)
- ✅ Fallback to default ₹500 (if database query fails)
- ✅ RLS enforced (only super admins can update)
- ✅ No hardcoded constants (fully configurable)

### Affected Components:
1. **WalletScreen**: Warning message dynamic
2. **TripDetailScreen**: Acceptance eligibility check uses dynamic value
3. **SuperAdminSettingsScreen**: New configuration interface

## Testing Checklist

- [ ] Run migration 067 on Supabase
- [ ] Super Admin can access Settings → Minimum Wallet Balance section
- [ ] Can edit the minimum balance value
- [ ] Save successfully updates app_settings table
- [ ] Driver screens show new minimum on refresh/reload
- [ ] Trip acceptance blocked if wallet below new minimum
- [ ] Warning messages show correct amount
- [ ] Multiple drivers all see same updated minimum
- [ ] Fallback works if database is unavailable (shows ₹500)

## Future Enhancements

- [ ] Add separate minimums for different driver tiers/categories
- [ ] Add audit log of who changed settings and when
- [ ] Add visual chart of wallet balances vs minimum requirement
- [ ] Add push notifications to drivers when minimum changes
- [ ] Schedule minimum balance changes to take effect at specific time

## Files Modified/Created

**Created:**
- `supabase/migrations/067_add_minimum_wallet_balance_setting.sql`
- `src/hooks/useSystemSettings.js`

**Modified:**
- `src/screens/superadmin/SettingsScreen.js` (+80 lines)
- `src/screens/driver/WalletScreen.js` (+2 lines)
- `src/screens/driver/TripDetailScreen.js` (+1 line)

**Constants Updated:**
- Removed hardcoded `MIN_WALLET_BALANCE = 500` from local scopes
- Now all fetch from app_settings table via hook

## Rollback Plan

If issues occur:
1. Revert migration: `ALTER TABLE app_settings DROP COLUMN minimum_wallet_balance_for_drivers;`
2. Restore hardcoded `MIN_WALLET_BALANCE = 500` in constants
3. Remove `useSystemSettings` hook usage from components
4. Use constant fallback in components

---

**Status**: ✅ Complete and Ready for Testing
**Last Updated**: June 28, 2026
**Database Table**: `app_settings` (id='global')
