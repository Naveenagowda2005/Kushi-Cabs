# Fix: Create active_sessions Table in NEW Account

## Problem
The `active_sessions` table is missing from the NEW account.

## Solution
Run the migration to create the table.

---

## Quick Fix (2 minutes)

### Step 1: Go to NEW Account
- Open: https://cqfsirfjwfxvwggjkrvd.supabase.co
- Click **SQL Editor** → **New Query**

### Step 2: Copy and Run Migration
1. Open file: `FIX_ACTIVE_SESSIONS_TABLE.sql`
2. Copy ALL content
3. Paste into SQL Editor
4. Click **Run** (Ctrl+Enter)

### Step 3: Verify
You should see:
```
active_sessions table created successfully
tablename: active_sessions
```

---

## What Gets Created

✅ `active_sessions` table (for device/session tracking)
✅ Indexes for fast lookups
✅ Functions for session management
✅ RLS disabled (ready for data import)

---

## After Creating Table

Now you can:
1. Import active_sessions data from OLD account
2. Continue with migration

The table is ready to receive data!

---

## Columns in active_sessions

| Column | Type | Purpose |
|--------|------|---------|
| id | BIGSERIAL | Session ID |
| user_id | UUID | User reference |
| device_id | TEXT | Device identifier |
| device_name | TEXT | Device name (iPhone, etc) |
| device_type | TEXT | Device OS (ios, android) |
| login_at | TIMESTAMP | When user logged in |
| last_activity_at | TIMESTAMP | Last activity time |
| is_active | BOOLEAN | If session is active |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

---

## Done!
Table is ready. Continue with data migration. 🚀
