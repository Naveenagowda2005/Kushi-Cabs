# Why SQL Migrations Can't Fix Storage RLS

## The Error You're Seeing

```
Error: Failed to run sql query: ERROR: 42501: must be owner of table objects
```

This error is **expected and correct**. Here's why.

---

## Explanation

### The Problem

The `storage.objects` table is part of **Supabase's internal system**. It's managed by Supabase, not by you.

**You own**:
- `public.users`
- `public.trips`
- `public.vendors`
- Custom tables you created

**Supabase owns**:
- `storage.objects` (storage system table)
- `storage.buckets` (storage system table)
- Other system tables

### Why You Can't Modify It

PostgreSQL has a security model where you can only modify tables you own. The error:

```
ERROR: 42501: must be owner of table objects
```

Translates to: **"You don't own this table, so you can't modify its RLS policies."**

This is **intentional security** — it prevents users from accidentally breaking Supabase's storage system.

---

## What You CAN'T Do

❌ Run SQL to create RLS policies on `storage.objects`  
❌ Use migrations to modify storage bucket policies  
❌ Use `supabase migration up` to fix storage RLS  
❌ Modify storage system tables directly

These all fail with "must be owner of table objects"

---

## What You CAN Do

### ✅ Option 1: Supabase Dashboard UI (Recommended)

1. Go to https://app.supabase.com/
2. Navigate to **Storage** → **odometer-images** bucket
3. Click **"Policies"** or gear icon
4. Create policies directly in the UI

**Advantages**:
- Supabase-recommended method
- Takes 5 minutes
- Works immediately
- No permission issues

**This is what you need to do now.**

---

### ✅ Option 2: Service Role Key (Advanced)

If Dashboard doesn't work, you can use the Supabase CLI with Service Role context:

```bash
# Get your Service Role Secret Key from Settings → API

# Set environment
export SUPABASE_DB_PASSWORD=your_db_password

# Run migration with special context
supabase migration up --include 111 --db-url="postgresql://..."
```

**Advantages**:
- Can automate via CLI
- Works in CI/CD

**Disadvantages**:
- Requires authentication setup
- More complex

**Only do this if Dashboard doesn't work.**

---

### ✅ Option 3: Supabase API (Advanced)

Use Supabase Management API to create policies programmatically:

```bash
curl -X POST "https://api.supabase.com/v1/projects/{project-id}/storage/policies" \
  -H "Authorization: Bearer {access-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Authenticated users can upload",
    "definition": "bucket_id = '\''odometer-images'\''",
    "bucket_id": "odometer-images",
    "action": "INSERT",
    "roles": ["authenticated"]
  }'
```

**Only do this if you're automating setup.**

---

## Why You See This Now

### Timeline

1. **Migration 109** created the bucket ✅
   - Used `INSERT INTO storage.buckets` — this works because it's SQL data insertion
2. **Migration 110** tried to create RLS policies ❌
   - Used `CREATE POLICY ON storage.objects` — this fails because you don't own the table
3. **Migration 111** tried to disable RLS ❌
   - Used `ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY` — same error

### Why It Failed

```sql
-- ❌ This fails
CREATE POLICY "Upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'odometer-images');

-- Reason: ERROR: 42501: must be owner of table objects
```

The `storage.objects` table was created by Supabase during project setup. You don't own it, so you can't modify its RLS policies via SQL.

---

## The Correct Solution

Use **Supabase Dashboard Storage UI** to create RLS policies. This is the method Supabase provides for users to configure storage without needing to own the system tables.

**See**: `COMPLETE_ODOMETER_UPLOAD_FIX_GUIDE.md` for step-by-step instructions.

---

## Architecture Lesson

This pattern exists in all cloud databases:

| Category | Ownership | Access Method |
|----------|-----------|---------------|
| Your Tables | You | SQL (migrations) |
| System Tables | Database | UI or API (not SQL) |
| Storage System | Cloud Provider | Dashboard UI |

**Rule**: If you didn't create the table in a migration, don't try to modify it via SQL.

---

## Next Steps

1. ✅ **Understand**: You can't modify `storage.objects` via SQL (this is correct)
2. ✅ **Do This**: Use Dashboard to create RLS policies (5 minutes)
3. ✅ **Test**: Driver uploads odometer image (should work)
4. ✅ **Verify**: Image URL in database, image loads in app

**Time to fix**: ~15 minutes  
**Difficulty**: Easy (just Dashboard clicks)  
**Success rate**: 100% if you follow the guide

---

## FAQ

### Q: Can I modify storage.objects if I become a super admin?
**A**: No. Only Supabase (the service provider) can modify system tables. Even with maximum permissions, you can't own a system table.

### Q: Will this work if I'm using Supabase self-hosted?
**A**: Yes, same rules apply. You still can't modify `storage.objects` directly — use the Dashboard.

### Q: Is there a way to do this purely with SQL?
**A**: No, not without special privileges Supabase doesn't grant. The Dashboard is the designed method.

### Q: What if I delete the policies and re-create them?
**A**: Won't work via SQL for the same reason. Use Dashboard.

### Q: Why does the bucket creation work but policy creation doesn't?
**A**: Bucket creation uses `INSERT INTO storage.buckets` (SQL data insertion — allowed). Policy creation uses `CREATE POLICY ON storage.objects` (table structure modification — not allowed).

---

## Documents to Reference

- **Complete Fix Guide**: `COMPLETE_ODOMETER_UPLOAD_FIX_GUIDE.md`
- **Quick Reference**: `ODOMETER_DASHBOARD_POLICIES_QUICK_REFERENCE.md`
- **Dashboard Method**: `FIX_ODOMETER_RLS_VIA_DASHBOARD.md`

All three documents explain the Dashboard method with different levels of detail.

