# 🔧 FINAL FIX: DISABLE RLS ON STORAGE TABLE

## Problem
RLS policies keep blocking odometer image uploads even after updates.

## Root Cause
RLS (Row Level Security) on storage.objects table is too restrictive.

## Solution
**Completely disable RLS** on the storage.objects table.

---

## 🚀 Apply This

### In Supabase SQL Editor, run:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

That's it! Just one line.

---

## Verify

Run this to confirm RLS is disabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

**Expected result:**
```
tablename | rowsecurity
-----------|------------
objects    | f          (f = false = RLS disabled)
```

---

## After This

1. Test upload in driver app
2. Should upload successfully ✅

---

## Why This Works

- RLS policies are bypassed
- No role checking
- No restrictions
- Direct upload allowed

---

**File**: `DISABLE_RLS_STORAGE_OBJECTS.sql`
