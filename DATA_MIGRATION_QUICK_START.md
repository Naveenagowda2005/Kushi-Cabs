# 🚀 Data Migration - Quick Start (3 Options)

## Current Status
- ✅ **NEW Account:** All 78 migrations applied, 25 tables created, RLS disabled
- ✅ **OLD Account:** Has production data, will be backup
- ✅ **Time:** ~30-60 minutes depending on data volume

---

## Choose Your Option:

### 🟢 OPTION A: Super Quick (If minimal data)
**Best for:** < 100 records total
**Time:** 5-10 minutes
**Effort:** Manual copy-paste

1. Go to OLD Account → View each table → Copy data
2. Go to NEW Account → Paste into each table
3. Verify counts match

📄 **Guide:** See `MIGRATION_STEPS_MANUAL.md` - Scroll to Step 5

---

### 🟡 OPTION B: Balanced (Recommended)
**Best for:** 100-10,000 records
**Time:** 15-30 minutes
**Effort:** Copy-paste SQL

**Steps:**
1. Open `EXPORT_DATA_FROM_OLD_ACCOUNT.sql` in OLD account
2. Run entire script, copy results
3. Open `IMPORT_DATA_TO_NEW_ACCOUNT.sql` in NEW account
4. Fill in VALUES sections with copied data
5. Run to import
6. Verify with count query

📄 **Guide:** See `DATA_MIGRATION_GUIDE.md` - Option B section

---

### 🔴 OPTION C: Fully Automated (If data is huge)
**Best for:** > 10,000 records or production
**Time:** 30-60 minutes
**Effort:** Requires backend code

Use a Node.js script to:
- Connect to OLD account
- Connect to NEW account
- Migrate table-by-table
- Verify integrity
- Rollback on errors

📄 **Guide:** Can create automation script if needed

---

## Which Option Should You Pick?

### Pick OPTION A if:
- You have few vendors/drivers/trips
- You want instant results
- You're testing the migration first

### Pick OPTION B if:
- You have moderate data (~1000 records)
- You want to control the process
- You want to verify before each import

### Pick OPTION C if:
- You have huge volume (>10k records)
- You want completely hands-off
- You need error recovery

---

## RECOMMENDED: Start with OPTION B (Balanced)

**Quick Summary:**

```
OLD Account: Export all data
   ↓
Copy export results
   ↓
NEW Account: Import data
   ↓
Verify counts match
   ↓
Test app works
   ↓
✅ Done!
```

---

## Pre-Migration Checklist

- [ ] Read `.env` file confirms NEW account URL
- [ ] RLS is disabled on NEW account ✅ (Already done)
- [ ] All migrations applied to NEW account ✅ (Already done)
- [ ] OLD account has full backup (screenshot important data)
- [ ] You have login to both accounts
- [ ] You have 30 minutes free time

---

## Start Migration Now

### For OPTION B (Recommended):

**Step 1:** Go to OLD Account (https://vofupwsnbcidjnifaihm.supabase.co)
- SQL Editor → New Query
- Copy `EXPORT_DATA_FROM_OLD_ACCOUNT.sql` content
- Paste and Run
- Copy all results to a text file

**Step 2:** Go to NEW Account (https://cqfsirfjwfxvwggjkrvd.supabase.co)
- SQL Editor → New Query
- Open `IMPORT_DATA_TO_NEW_ACCOUNT.sql`
- Replace VALUES with exported data
- Run

**Step 3:** Verify
```sql
-- Run this in NEW account
SELECT 'Users: ' || COUNT(*)::TEXT FROM users UNION ALL
SELECT 'Vendors: ' || COUNT(*)::TEXT FROM vendors UNION ALL
SELECT 'Drivers: ' || COUNT(*)::TEXT FROM drivers;
```

Should match OLD account counts.

**Step 4:** Test
- Restart app
- Try logging in
- Verify data appears

---

## Files Created for Migration

1. **DATA_MIGRATION_GUIDE.md** - Full reference guide (all options, troubleshooting)
2. **MIGRATION_STEPS_MANUAL.md** - Click-by-click walkthrough (OPTION A)
3. **EXPORT_DATA_FROM_OLD_ACCOUNT.sql** - Export script (OPTION B)
4. **IMPORT_DATA_TO_NEW_ACCOUNT.sql** - Import script (OPTION B)
5. **This file** - Quick start reference

---

## Support

**Issue:** "Error: relation does not exist"
→ Migrations not applied. But they are already applied ✅

**Issue:** "Foreign key violation"
→ Importing tables in wrong order. Follow the order in script.

**Issue:** "Count mismatch after import"
→ Some data failed. Check for error messages and rerun failed tables.

**Issue:** "App still connects to OLD account"
→ Check `.env` file is updated with NEW URL. Restart app.

---

## After Migration

1. ✅ Verify all data in NEW account
2. ✅ Test app fully
3. ✅ Keep OLD account as backup (30 days minimum)
4. ✅ Update any monitoring/backups to use NEW account
5. ✅ Document migration in project notes

---

## Next Steps

**Ready to start?**
1. Pick your option (A, B, or C)
2. Read corresponding guide
3. Execute migration
4. Report any issues

**Questions?** Check `DATA_MIGRATION_GUIDE.md` for detailed explanations.

