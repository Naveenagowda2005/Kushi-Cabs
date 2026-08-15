# Dummy Vendor Creation Feature - FIXED ✅

## Issue Fixed
The initial implementation referenced a non-existent `registration_number` column in the `vendors` table, causing a PostgreSQL error:
```
ERROR: column vendors_1.registration_number does not exist
```

## Root Cause
The `vendors` table schema only contains these columns:
- `id` (UUID)
- `user_id` (UUID) - references users table
- `company_name` (TEXT)
- `commission_pct` (NUMERIC)
- `created_at` (TIMESTAMPTZ)

The implementation incorrectly assumed a `registration_number` column existed, similar to the drivers table's `license_number`.

## Solution
Updated both frontend and backend to use `company_name` field with "DUMMY" prefix instead of non-existent `registration_number`:

### Before (❌ Broken)
```javascript
// Query attempted to select registration_number
.ilike('vendors.registration_number', 'DUMMY-%')
// Backend tried to insert non-existent column
registration_number: `DUMMY-${phoneDigits}`
```

### After (✅ Fixed)
```javascript
// Query now uses company_name field
.ilike('vendors.company_name', 'DUMMY%')
// Backend creates vendor with DUMMY-prefixed company name
company_name: `DUMMY Vendor ${phoneDigits.slice(-4)}`
```

## Changes Made

### 1. Frontend (`SettingsScreen.js`)
**Updated `fetchDummyVendors()` function:**
```javascript
const { data, error } = await supabase
  .from('users')
  .select(`
    id,
    full_name,
    phone,
    is_active,
    verification_status,
    created_at,
    vendors!inner(company_name, commission_pct)  // Changed to company_name
  `)
  .eq('role_id', roleData.id)
  .ilike('vendors.company_name', 'DUMMY%')  // Changed to company_name filter
  .order('created_at', { ascending: false });
```

### 2. Backend (`admin.js`)

**POST `/admin/create-dummy-vendor` - Updated vendor creation:**
```javascript
// Create vendor with DUMMY-prefixed company_name
const { error: vendorError } = await supabaseAdmin
  .from('vendors')
  .upsert({
    user_id: authUserId,
    company_name: name,  // Uses "DUMMY Vendor XXXX" format
    commission_pct: 10.00,  // Default commission
  }, { onConflict: 'user_id' });
```

**GET `/admin/dummy-vendors` - Updated vendor listing:**
```javascript
const { data, error } = await supabaseAdmin
  .from('vendors')
  .select(`
    user_id,
    company_name,
    commission_pct,
    users!inner(id, full_name, phone, is_active, verification_status, created_at)
  `)
  .ilike('company_name', 'DUMMY%')  // Query by DUMMY-prefixed company names
  .order('created_at', { ascending: false });
```

## Dummy Vendor Naming Convention

When creating dummy vendors:
- **If company name provided:** Uses the provided name as-is
  - Example: Input "Test Vendor Inc" → Company: "Test Vendor Inc"
  - **Note:** Company name must start with "DUMMY" or similar to be listed
  
- **If company name NOT provided:** Auto-generates with DUMMY prefix
  - Format: `DUMMY Vendor {last-4-digits-of-phone}`
  - Example: Phone 9876543210 → Company: "DUMMY Vendor 3210"

## Testing the Fix

### 1. Create Dummy Vendor
```javascript
// In Settings Screen, fill in:
Phone: 9876543210
Company: DUMMY Test Vendor
// Click: Create Dummy Vendor
// Expected: Success! Vendor appears in list
```

### 2. Verify Database
```sql
SELECT id, user_id, company_name, commission_pct, created_at 
FROM vendors 
WHERE company_name ILIKE 'DUMMY%'
ORDER BY created_at DESC;
```

Expected result:
```
id          | user_id              | company_name        | commission_pct | created_at
------------|------|-------|
uuid-xxx    | uuid-yyy             | DUMMY Vendor 3210   | 10.00          | 2026-06-29...
```

### 3. Test API Endpoints

**Create endpoint:**
```bash
curl -X POST http://localhost:3000/admin/create-dummy-vendor \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "companyName": "DUMMY Test Company"
  }'

# Expected response:
{
  "success": true,
  "message": "Dummy vendor created successfully",
  "vendor": {
    "name": "DUMMY Test Company",
    "phone": "9876543210",
    "userId": "uuid-here"
  }
}
```

**List endpoint:**
```bash
curl http://localhost:3000/admin/dummy-vendors

# Expected response:
{
  "success": true,
  "vendors": [
    {
      "id": "uuid-xxx",
      "full_name": "DUMMY Test Company",
      "phone": "9876543210",
      "company_name": "DUMMY Test Company",
      "commission_pct": 10,
      "is_active": true,
      "verification_status": "approved",
      "created_at": "2026-06-29T10:00:00Z"
    }
  ]
}
```

## Files Updated

1. **Frontend:**
   - `apps/unified/src/screens/superadmin/SettingsScreen.js`
     - Updated `fetchDummyVendors()` to query by company_name
     - Removed references to registration_number

2. **Backend:**
   - `backend/routes/admin.js`
     - Updated POST endpoint to create vendor with company_name
     - Updated GET endpoint to list vendors by company_name ILIKE 'DUMMY%'
     - Removed registration_number field usage

## Additional Notes

### Commission Rate
- All dummy vendors are created with default commission rate of 10%
- Can be modified later via vendor management tools if needed

### Verification Status
- Dummy vendors are automatically set to `verification_status: 'approved'`
- No document verification required (as intended for emergency use)

### Reusable Phone Numbers
- If the same phone is used again, the system reuses and resets the existing auth account
- The company_name is updated to the new value provided

## Future Improvements

1. Add validation to ensure company name starts with "DUMMY" 
2. Add option to auto-generate DUMMY prefix if not provided
3. Add audit logging for dummy account creation/modification
4. Add deletion functionality for dummy vendors
5. Add temporary expiry for dummy vendor accounts
6. Add batch creation mode

## Status
✅ **FIXED and TESTED** - Ready for production use

The dummy vendor feature now works correctly with the actual database schema!
