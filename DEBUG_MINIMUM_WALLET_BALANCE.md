# Debug: Minimum Wallet Balance Settings

## ⚠️ ISSUE FOUND

**Database Value:** `minimum_wallet_balance_for_drivers = 0`

This is why drivers are seeing inconsistent amounts! The value was set to **0** instead of a proper minimum.

## Solution

Run this SQL query in Supabase SQL Editor to fix it:

```sql
UPDATE public.app_settings 
SET minimum_wallet_balance_for_drivers = 500 
WHERE id = 'global';
```

Then verify:
```sql
SELECT id, minimum_wallet_balance_for_drivers FROM public.app_settings WHERE id = 'global';
```

Should show: `minimum_wallet_balance_for_drivers = 500`

---

## Problem
The minimum wallet balance set by super admin is not being fetched correctly in the app.

## How to Check What Super Admin Set

### Method 1: Check via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click on "SQL Editor"
3. Run this query:
```sql
SELECT id, minimum_wallet_balance_for_drivers FROM public.app_settings WHERE id = 'global';
```
4. Check the value in `minimum_wallet_balance_for_drivers` column

### Method 2: Check via App Settings Screen
1. Open the app as Super Admin
2. Go to **Settings** tab
3. Scroll to **Wallet Balance Settings** section
4. You will see "Current Minimum Balance: ₹XXX"
5. This is the value stored in the database

### Method 3: Check Console Logs
The app now logs the fetched minimum wallet balance value:

**In useSystemSettings Hook:**
```
🔍 Fetching system settings from app_settings table...
📊 Fetched data: { id: 'global', minimum_wallet_balance_for_drivers: 500 }
✅ Setting minimum wallet balance to: 500 Type: number
```

**In SettingsScreen:**
```
✅ Updated minWalletBalance display to: 500
📊 Current settings object: { minimumWalletBalance: 500 }
```

## Where Minimum Wallet Balance is Used

### 1. **Trip Detail Screen** (Driver)
- File: `src/screens/driver/TripDetailScreen.js`
- Line: `const minWalletBalance = settings.minimumWalletBalance || 500;`
- Purpose: Prevents driver from accepting trips if wallet is below minimum

### 2. **Wallet Screen** (Driver)
- File: `src/screens/driver/WalletScreen.js`
- Line: `const minWalletBalance = settings.minimumWalletBalance || 500;`
- Purpose: Shows warning if wallet balance is too low

### 3. **Settings Screen** (Super Admin)
- File: `src/screens/superadmin/SettingsScreen.js`
- Purpose: Displays current value and allows editing

## Data Flow

```
Supabase (app_settings table)
    ↓
useSystemSettings() hook
    ↓ (fetches minimum_wallet_balance_for_drivers)
    ↓ (converts to minimumWalletBalance)
    ↓
TripDetailScreen / WalletScreen / SettingsScreen
    ↓ (reads settings.minimumWalletBalance)
    ↓ (uses value with fallback to 500)
```

## Troubleshooting

### Issue: Showing 500 but Super Admin Set Different Value

**Check:**
1. Open browser DevTools → Console
2. Look for logs like:
   ```
   🔍 Fetching system settings...
   📊 Fetched data: { id: 'global', minimum_wallet_balance_for_drivers: XXX }
   ```
3. Compare the fetched value with what super admin set

**Solutions:**
- Clear app cache and reload
- Check if the UPDATE was successful in SettingsScreen
- Verify the value was actually saved to Supabase (check database directly)

### Issue: Settings Show Different Value on Different Screens

**All screens should use the same value:**
- ✅ All default to 500 if not set
- ✅ All fetch from `settings.minimumWalletBalance`
- ✅ All use same `useSystemSettings()` hook

## Default Values

If no value is set or database query fails:
- **TripDetailScreen**: Falls back to **500**
- **WalletScreen**: Falls back to **500**
- **useSystemSettings Hook**: Falls back to **500**

## Recent Changes

**Fixed Inconsistencies:**
- WalletScreen was using default 100 → Changed to 500 ✅
- Both screens now use same default 500 ✅
- useSystemSettings now ensures Number type ✅
- Added better logging for debugging ✅

## Quick Test

1. As Super Admin:
   - Go to Settings
   - Set minimum balance to a unique value (e.g., 1234)
   - Save and note the console log

2. As Driver:
   - Go to Trip Details or Wallet Screen
   - Check console logs
   - Verify it shows the same value (1234)

3. If different:
   - Check the logs to identify where the mismatch occurs
   - Share the console output for debugging
