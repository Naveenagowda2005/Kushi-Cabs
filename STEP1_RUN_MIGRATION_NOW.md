# Step 1: Run Migration 101 - FIXED VERSION ✅

## What Was Fixed
Previous errors were:
1. ❌ COMMENT syntax error → ✅ Fixed (now uses COMMENT ON COLUMN)
2. ❌ ALTER TABLE storage.objects permission error → ✅ Removed (not needed)

The migration now:
- ✅ Adds 4 columns to database tables (storage_path, document_url, avatar_storage_path, avatar_url)
- ✅ Creates 2 indexes for performance
- ✅ Includes commented RLS policies for reference (no more permission errors!)

---

## NOW: Run This Migration

### Step 1: Go to Supabase
```
1. https://app.supabase.com
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
```

### Step 2: Copy the SQL
Copy entire SQL from:
```
newtaxi/supabase/migrations/101_create_storage_buckets.sql
```

### Step 3: Paste & Run
```
1. Paste into SQL Editor
2. Click "Run" button
3. Wait for result
```

### Step 4: Expected Output
```
✅ Success! 
   Query executed successfully
   Applied to X rows
```

---

## If Still Getting Errors

If you get permission errors, try this simpler version instead:

```sql
-- Step 1: Add storage path columns to tables
ALTER TABLE driver_documents
ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE driver_documents
ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_driver_documents_storage_path 
ON driver_documents(storage_path) WHERE storage_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_avatar_storage_path 
ON public.users(avatar_storage_path) WHERE avatar_storage_path IS NOT NULL;
```

This is the minimal version that should definitely work.

---

## After Migration Succeeds

Once you see ✅ success:

1. ✅ Database columns are added
2. ✅ Indexes are created
3. ⏳ Move to Step 2: Run migration API calls

---

## What This Migration Does

```
BEFORE:
  driver_documents table:
    - id
    - driver_id
    - document_data (base64)
    - document_type
    ...

AFTER (new columns added):
  driver_documents table:
    - id
    - driver_id
    - document_data (base64) ← old data still here
    - document_type
    - storage_path ← NEW
    - document_url ← NEW
    ...

  users table:
    - id
    - email
    - avatar_base64 ← old data still here
    ...
    - avatar_storage_path ← NEW
    - avatar_url ← NEW
```

This allows the app to store both old data (base64) and new data (storage paths) together during transition.

---

## Troubleshooting

**Error: "syntax error"**
- Copy fresh SQL from migration file
- Make sure no line breaks in middle of statement

**Error: "permission denied"**
- You're not owner of table
- Try simpler version above
- Or contact Supabase support

**Error: "column already exists"**
- Migration already ran successfully ✅
- Safe to ignore, move to Step 2

---

## Ready? Go run the migration! 🚀
