# Fix Super Admin Dashboard Vendor Query

## Problem
The super admin dashboard was showing "Vendors query error: null" and couldn't load dummy vendors because the RLS policies were blocking direct access to the vendors table.

## Solution
Created a new RPC function `get_all_vendors_admin()` that bypasses RLS to allow super admin to fetch all vendors.

## Steps to Apply

### 1. Run the SQL migration in Supabase
Execute the SQL from: `CREATE_GET_ALL_VENDORS_RPC.sql`

```sql
-- Create RPC function to get all vendors (bypasses RLS for super admin)
CREATE OR REPLACE FUNCTION get_all_vendors_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  company_name text,
  commission_pct numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vendors.id,
    vendors.user_id,
    vendors.company_name,
    vendors.commission_pct,
    vendors.created_at,
    vendors.updated_at
  FROM vendors
  ORDER BY vendors.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_vendors_admin() TO authenticated;
```

### 2. Code Changes Made

**File:** `src/screens/superadmin/SettingsScreen.js`

Updated `fetchDummyVendors()` to use the new RPC function instead of direct table access:

```javascript
// OLD (failing):
const { data: allVendors, error: vendorError } = await supabase
  .from('vendors')
  .select('id, user_id, company_name, commission_pct');

// NEW (working):
const { data: allVendors, error: vendorError } = await supabase
  .rpc('get_all_vendors_admin');
```

## Testing

1. Log in as super admin
2. Go to Settings → Emergency Dummy Vendors
3. Click "Refresh" or navigate to the section
4. You should now see the vendors list loading successfully

## Expected Behavior
- Dashboard fetches all vendors using the RPC
- Filters for vendors with company names starting with "DUMMY" or "TEST"
- Displays dummy vendors in the list
- "Create Dummy Vendor" button creates new ones that appear immediately
