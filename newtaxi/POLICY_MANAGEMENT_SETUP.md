# Policy Management System - Setup & Usage

## Overview
Super admin can now manage app policies (Privacy, Terms, Cancellation, Refund, Safety Guidelines) that automatically appear in both driver and vendor profile screens.

## Files Created/Updated

### 1. Database
- **Migration**: `053_create_app_policies_table.sql`
  - Creates `app_policies` table
  - Stores: policy_type, content, applies_to, version, timestamps
  - RLS policies allow super admin to manage, drivers/vendors to read

### 2. Super Admin Screen
- **New Screen**: `PolicyManagementScreen.js`
  - Accessed from Settings tab
  - Shows all 5 policy types with status (Configured/Not configured)
  - Edit each policy in a modal
  - Shows content preview and metadata (last updated date)
  - Real-time updates to database

### 3. Shared Components
- **New Hook**: `useAppPolicies.js`
  - Fetches all policies from database
  - Used by driver and vendor profile screens
  - Auto-refresh every 10 seconds when focused

- **New Screen**: `ViewPolicyScreen.js` (in common)
  - Displays policy content
  - Accessible from driver/vendor profile menus
  - Route: `ViewPolicy` with `policyType` parameter

### 4. Updated Screens
- **SettingsScreen.js** (Super Admin)
  - Added "App Policies" card with link to PolicyManagementScreen
  - Route navigation to PolicyManagement

- **ProfileScreen.js** (Driver)
  - Updated menu items to show all 5 policies
  - Links to ViewPolicy screen with correct policy type

- **ProfileScreen.js** (Vendor)
  - Updated menu items to show all 5 policies
  - Links to ViewPolicy screen with correct policy type

### 5. Navigation
- **SuperAdminNavigator.js**
  - Added PolicyManagementScreen import
  - Configured stack navigation to handle PolicyManagement route
  - Updated ScreenWrapper to support nested navigation

## Policy Types
1. **Privacy Policy** - `privacy_policy`
2. **Terms & Conditions** - `terms_conditions`
3. **Cancellation Policy** - `cancellation_policy`
4. **Refund Policy** - `refund_policy`
5. **Safety Guidelines** - `safety_guidelines`

## How It Works

### For Super Admin
1. Go to Settings tab
2. Tap "App Policies" card
3. Select any policy type
4. Tap to edit and enter/update content
5. Tap "Save Policy"
6. Updates immediately visible to drivers/vendors

### For Drivers
1. Go to Profile tab
2. Scroll to menu section
3. See all 5 policies listed
4. Tap any policy to read full content
5. Content auto-updates when super admin changes it

### For Vendors
1. Go to Profile tab
2. Scroll to menu section
3. See all 5 policies listed
4. Tap any policy to read full content
5. Content auto-updates when super admin changes it

## Database Schema

```sql
CREATE TABLE app_policies (
  id UUID PRIMARY KEY,
  policy_type TEXT NOT NULL UNIQUE,    -- privacy_policy, terms_conditions, etc
  content TEXT NOT NULL,               -- Full policy text
  applies_to TEXT[] DEFAULT ARRAY['driver', 'vendor'],
  version INT DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID
);
```

## RLS Policies
- **Super Admin**: Full access (read, write, update)
- **Drivers**: Can read policies where applies_to includes 'driver'
- **Vendors**: Can read policies where applies_to includes 'vendor'

## Setup Instructions

### 1. Apply Migration
Run in Supabase SQL Editor:
```sql
-- Copy content from: supabase/migrations/053_create_app_policies_table.sql
```

### 2. Add Route to Driver Navigator
In `DriverNavigator.js`, add to Stack:
```javascript
<Stack.Screen 
  name="ViewPolicy" 
  component={ViewPolicyScreen}
  options={{ headerShown: false }}
/>
```

### 3. Add Route to Vendor Navigator
In `VendorNavigator.js`, add to Stack:
```javascript
<Stack.Screen 
  name="ViewPolicy" 
  component={ViewPolicyScreen}
  options={{ headerShown: false }}
/>
```

### 4. Hard Refresh
- Frontend: Ctrl+Shift+R
- Backend: Restart if needed

## Testing

1. **Super Admin**: Go to Settings → "App Policies"
2. **Update a policy**: Edit Privacy Policy with test content
3. **Driver**: Go to Profile → "Privacy Policy"
4. **Verify**: Should see updated content immediately
5. **Vendor**: Go to Profile → "Privacy Policy"
6. **Verify**: Should see same updated content

## Features

✅ Super admin manages all policies in one place
✅ Policies apply to both drivers and vendors
✅ Auto-updating - drivers/vendors see changes immediately
✅ Status badges show which policies are configured
✅ Content preview in admin dashboard
✅ Last updated timestamps
✅ No character limit for policy content
✅ RLS-protected - users can only read allowed policies
✅ Search & manage from settings tab

## Notes
- All policies are shared between drivers and vendors (not separate)
- Content is stored as plain text (markdown compatible if needed)
- No versioning control yet (can be added later)
- Policies are optional - not required to create
- Updates are real-time via Supabase

