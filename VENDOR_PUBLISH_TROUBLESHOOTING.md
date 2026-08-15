# 🔧 VENDOR PUBLISH BUTTON - TROUBLESHOOTING

## Issue: Badge Still Shows "Draft" After Publishing

### Symptoms
- Click "Publish" button
- Success modal appears
- But badge still shows "Draft" (orange)

### Root Causes & Solutions

**❌ Cause 1: Old component code not reloaded**
```bash
Solution:
1. Stop the Expo dev server (Ctrl+C)
2. Clear watchman cache: watchman watch-del-all
3. Clear node_modules: rm -rf node_modules
4. npm install
5. Start dev server: npm start
6. Force refresh app (r key in Expo CLI)
```

**❌ Cause 2: is_published column doesn't exist**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name='trips' AND column_name='is_published';

-- If not exists, add it (should exist from migration 109)
ALTER TABLE trips ADD COLUMN is_published BOOLEAN DEFAULT false;
```

**❌ Cause 3: Column type is wrong (e.g., TEXT instead of BOOLEAN)**
```sql
-- Check column type
SELECT data_type FROM information_schema.columns 
WHERE table_name='trips' AND column_name='is_published';

-- If TEXT, convert it:
ALTER TABLE trips ALTER COLUMN is_published TYPE BOOLEAN USING is_published::boolean;
```

**❌ Cause 4: SELECT query missing is_published**
```javascript
// ❌ WRONG - Missing is_published in select
const { data } = await supabase.from('trips').select('*')

// ✅ CORRECT - Includes is_published
const { data } = await supabase.from('trips').select('*, is_published')
```
Status: ✅ Already fixed in fetchMyTrips, refreshTrips, and handlePublish

**❌ Cause 5: RLS policies blocking the update**
```sql
-- Check vendor can update their own trips
SELECT * FROM pg_policies 
WHERE tablename = 'trips' AND policyname LIKE '%update%';

-- If missing, add this policy:
CREATE POLICY "Vendors can update their own trips"
  ON trips
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
```

---

## Issue: Button Shows Spinner Forever

### Symptoms
- Click "Publish" button
- Spinner shows but never stops
- Button stays disabled

### Root Causes & Solutions

**❌ Cause 1: Database update is timing out**
```javascript
// Add timeout logging
const timeoutId = setTimeout(() => {
  console.error('❌ UPDATE taking too long!');
  setPublishing(null);
}, 10000); // 10 seconds

try {
  const { data, error } = await supabase
    .from('trips')
    .update({ is_published: true })
    .eq('id', tripId)
    .select();
  clearTimeout(timeoutId);
  // ... rest of code
} catch (err) {
  clearTimeout(timeoutId);
  // handle error
}
```

**❌ Cause 2: is_published value is already what you're trying to set**
- Database doesn't error, but returns no rows
```javascript
// Solution: Check if already in desired state
if (item.is_published === true) {
  // Skip update, just close modal
  return;
}
```

**❌ Cause 3: Network request is actually failing silently**
```javascript
// Add network logging
console.log('📤 About to update trip:', tripId);
const startTime = Date.now();

const { data, error } = await supabase
  .from('trips')
  .update({ is_published: true })
  .eq('id', tripId)
  .select();

const duration = Date.now() - startTime;
console.log(`⏱️ Update took ${duration}ms, Result:`, { data, error });
```

---

## Issue: Modal Shows Old Data

### Symptoms
- Publish trip
- Modal is already open
- Modal still shows "Publish" button (not "Unpublish")
- Close and reopen modal → now shows correct state

### Root Causes & Solutions

**❌ Cause: selectedTrip state not updated when trips state changes**
```javascript
// ✅ SOLUTION: Add effect to sync selectedTrip
useEffect(() => {
  if (selectedTrip && trips.length > 0) {
    const updatedTrip = trips.find(t => t.id === selectedTrip.id);
    if (updatedTrip) {
      setSelectedTrip(updatedTrip);
    }
  }
}, [trips]);
```

---

## Issue: Success Modal Appears but Nothing Happened

### Symptoms
- Click "Publish"
- Success modal shows "✅ Published - Trip is now visible..."
- But in database trip.is_published is still false

### Root Causes & Solutions

**❌ Cause 1: Database UPDATE succeeded but returned no data**
```javascript
// The .select() is crucial - without it, we don't get response data
// ❌ WRONG
await supabase.from('trips').update({ is_published: true }).eq('id', tripId)

// ✅ CORRECT
await supabase.from('trips').update({ is_published: true }).eq('id', tripId).select()
```

**❌ Cause 2: RLS policy allows READ but not UPDATE**
```sql
-- If you have this:
CREATE POLICY "Read own trips"
  ON trips
  FOR SELECT
  USING (auth.uid() = created_by);

-- You also need this:
CREATE POLICY "Update own trips"
  ON trips
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
```

---

## Issue: Different Trips Affect Each Other

### Symptoms
- Trip A shows "Unpublish" when Trip B is published
- Button states are mixed up
- Wrong trip updates

### Root Causes & Solutions

**❌ Cause: Component re-creation causing state pollution**
Status: ✅ FIXED - TripItem now extracted and memoized with React.memo

**❌ Cause 2: Key extractor not unique**
```javascript
// ❌ WRONG - If multiple trips have same name
keyExtractor={(item) => item.pickup_location}

// ✅ CORRECT
keyExtractor={(item) => item.id}
```
Status: ✅ Already correct in code

---

## Issue: Publish Works But Drivers Can't See Trip

### Symptoms
- Vendor publishes trip
- Badge shows "Published"
- But drivers don't see trip in available trips list

### Root Causes & Solutions

**❌ Cause 1: Drivers' query doesn't check is_published**
```javascript
// ❌ WRONG
const { data } = await supabase.from('trips').select('*').eq('status', 'pending')

// ✅ CORRECT
const { data } = await supabase.from('trips').select('*, is_published')
  .eq('status', 'pending')
  .eq('is_published', true)
```

**❌ Cause 2: RLS policy hides published trips from drivers**
```sql
-- Check driver can see published trips
SELECT * FROM pg_policies 
WHERE tablename = 'trips' AND policyname LIKE '%read%';

-- If missing, add:
CREATE POLICY "Drivers can see published trips"
  ON trips
  FOR SELECT
  USING (is_published = true AND status IN ('pending', 'accepted'))
```

---

## Quick Checklist

Use this to diagnose issues:

```
[ ] Database column is_published exists and is BOOLEAN type
[ ] SELECT queries include is_published field
[ ] UPDATE queries include .select() for response
[ ] RLS policies allow UPDATE for vendors
[ ] TripItem component is extracted with React.memo
[ ] Callbacks are memoized with useCallback
[ ] FlatList has extraData={trips}
[ ] keyExtractor uses item.id (not index)
[ ] Network requests show in debugger
[ ] App is fully restarted after code changes
```

---

## Still Not Working?

Try this nuclear option:

```bash
# 1. Clear everything
cd newtaxi/apps/unified
npm run clean          # or rm -rf node_modules .expo
npm install
npm start

# 2. Check database state
# Run in Supabase SQL editor:
SELECT id, is_published, status, created_at 
FROM trips 
WHERE created_by = 'YOUR_VENDOR_ID' 
ORDER BY created_at DESC 
LIMIT 1;

# 3. Check RLS policies
SELECT tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'trips' 
ORDER BY policyname;

# 4. Check logs in React Native Debugger
# Look for red errors and blue info messages
```

---

**Version**: 1.0
**Updated**: Latest
**Status**: Use after code deployment
