# Debug & Fix: Vendors Not Showing + Auto-Refresh Issue

## Issues
1. **Vendors not showing** - Even after RLS fix
2. **Dummy driver list not updating** - After deletion

## Root Causes
1. **useFocusEffect has empty dependency array** - Not actually calling fetch functions on focus
2. **Missing refresh delay** - Database sync delay after creation
3. **Query might not be running** - Need to verify in console logs

## Solution: Add Console Logging & Fix Dependency Array

### Step 1: Update useFocusEffect in SettingsScreen.js

**Find this code (around line 162):**
```javascript
useFocusEffect(useCallback(() => { 
  fetchDummyDrivers();
  fetchDummyVendors();
}, []));
```

**Replace with:**
```javascript
useFocusEffect(useCallback(() => { 
  console.log('Settings screen focused - refreshing lists');
  fetchDummyDrivers();
  fetchDummyVendors();
}, [fetchDummyDrivers, fetchDummyVendors]));
```

**Why:** The empty dependency array means the callback might not actually call the functions. Adding the functions to dependencies ensures they're called.

---

### Step 2: Add Logging to fetchDummyVendors

**Find the fetchDummyVendors function and add these console.logs:**

```javascript
const fetchDummyVendors = useCallback(async () => {
  try {
    setLoadingDummyVendor(true);
    console.log('🔄 Fetching dummy vendors from Supabase');  // ← Add this
    
    // ... rest of code ...
    
    console.log('📊 Query result:', data);  // ← Add this after query
    console.log('❌ Query error:', error);  // ← Add this
    
    if (error) {
      console.error('⚠️ Error fetching from Supabase:', error);  // ← Add this
      return;
    }

    if (data) {
      console.log(`✅ Found ${data.length} dummy vendors`);  // ← Add this
      setDummyVendors(data);
    } else {
      console.log('⚠️ No data returned');  // ← Add this
      setDummyVendors([]);
    }
  } catch (e) {
    console.error('❌ Error fetching dummy vendors:', e);  // ← Add this
  } finally {
    setLoadingDummyVendor(false);
  }
}, []);
```

---

### Step 3: Add Delay to handleCreateDummyVendor

**Find handleCreateDummyVendor and after Alert.alert, add:**

```javascript
// Wait a moment for database sync
await new Promise(r => setTimeout(r, 500));
console.log('🔄 Refreshing vendor list after creation...');
await fetchDummyVendors();
```

---

## Test & Debug

### Step 1: Open Console
1. Open Expo app
2. Open Developer Console (Cmd+D on iOS, shake on Android)
3. Click "Flip Console"
4. You should see logs

### Step 2: Create Dummy Vendor
1. Go to Settings
2. Create a new dummy vendor
3. **Check console for logs:**
   - Should see: `🔄 Fetching dummy vendors from Supabase`
   - Should see: `📊 Query result: [...]`
   - Should see: `✅ Found X dummy vendors`

### Step 3: Expected Log Output
```
🔄 Fetching dummy vendors from Supabase
✅ Found vendor role: uuid-xxx
📊 Query result: [
  {id: 'uuid', full_name: 'DUMMY Vendor 123', phone: '9999888877', ...}
]
❌ Query error: null
✅ Found 1 dummy vendors
```

---

## If Logs Show Vendors But UI Doesn't Display

**Problem:** Query returns data but UI doesn't render

**Check:**
1. Is the UI code filtering correctly?
2. Is the list actually rendering?
3. Are there RLS errors silently failing?

**Test:**
```javascript
// In console, check state
console.log('dummyVendors state:', dummyVendors);
console.log('loadingDummyVendor:', loadingDummyVendor);
```

---

## If Logs Show No Vendors

**Problem:** Query returns empty array

**Possible causes:**
1. RLS policy still blocking reads
2. Vendor role ID is wrong
3. Company names don't start with "DUMMY"

**Debug:**
```sql
-- Run in Supabase SQL Editor
-- Check if vendors exist
SELECT id, company_name, user_id FROM vendors LIMIT 10;

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'vendors';

-- Check if super admin can read
SELECT * FROM vendors WHERE company_name ILIKE 'DUMMY%';
```

---

## If Still Not Working

### Option 1: Disable RLS Temporarily (For Testing)
```sql
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
```

Then test if vendors appear. If they do, RLS is the issue.

### Option 2: Check Auth User Role
```javascript
// In SettingsScreen or console
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('User ID:', user?.id);

// Check their role in database
const { data: userData } = await supabase
  .from('users')
  .select('id, role_id, roles(name)')
  .eq('id', user.id)
  .single();
console.log('User role:', userData);
```

---

## Quick Fixes Checklist

- [ ] Add logging to console
- [ ] Update useFocusEffect dependency array
- [ ] Add refresh delay in handleCreateDummyVendor
- [ ] Restart Expo app
- [ ] Check console logs when creating vendor
- [ ] Verify RLS policies exist in Supabase
- [ ] Manually refresh Settings screen
- [ ] Try disabling RLS temporarily for testing

---

## Files to Update

**File:** `apps/unified/src/screens/superadmin/SettingsScreen.js`

**Changes:**
1. Line ~162: Add dependency array to useFocusEffect
2. Line ~109-155: Add console.logs to fetchDummyVendors
3. Line ~200-230: Add delay to handleCreateDummyVendor

---

## Next Steps

1. **Add the logging** as shown above
2. **Restart Expo app** (clear cache if needed)
3. **Create a new dummy vendor**
4. **Open console and watch the logs**
5. **Share what logs you see** (or test passes/fails)

The logs will tell us exactly where the issue is! 🔍
