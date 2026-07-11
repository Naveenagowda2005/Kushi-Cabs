# Supabase Account Migration Guide

## Migration Complete ✅

All configuration files have been updated to use the new Supabase account.

### Updated Credentials:

**Old Account:**
- URL: `https://vofupwsnbcidjnifaihm.supabase.co`
- Project: vofupwsnbcidjnifaihm

**New Account:**
- URL: `https://cqfsirfjwfxvwggjkrvd.supabase.co`
- Project: cqfsirfjwfxvwggjkrvd

### Files Updated:

1. **Frontend (.env)**
   - `newtaxi/apps/unified/.env`
   - ✅ EXPO_PUBLIC_SUPABASE_URL updated
   - ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY updated

2. **Backend (.env)**
   - `backend/.env`
   - ✅ SUPABASE_URL updated
   - ✅ SUPABASE_SERVICE_ROLE_KEY updated

### Next Steps:

1. **Run Migrations on New Database**
   ```bash
   cd newtaxi
   supabase db push
   ```
   This will apply all migrations from `supabase/migrations/` to the new database.

2. **Export Data from Old Database** (if needed)
   ```bash
   # Connect to old Supabase and export tables
   pg_dump -h db.vofupwsnbcidjnifaihm.supabase.co -U postgres > old_backup.sql
   ```

3. **Import Data to New Database** (if migrating existing data)
   ```bash
   # Connect to new Supabase and import data
   psql -h db.cqfsirfjwfxvwggjkrvd.supabase.co -U postgres < old_backup.sql
   ```

4. **Verify Connection**
   - Start the app and check Supabase connection logs
   - Verify all API calls work correctly
   - Check auth functionality

5. **Test All Features**
   - User registration/login
   - Trip creation and assignment
   - Vendor operations
   - Driver operations
   - Payment processing

### Important Notes:

⚠️ **Data Migration:**
- The new database will start empty with just the schema from migrations
- All existing data must be manually exported and imported if needed
- RLS (Row Level Security) policies are included in migrations

⚠️ **API Keys:**
- Service Role Key: For backend admin operations (backend/.env)
- Anon Key: For frontend public access (apps/unified/.env)
- Never commit these keys to public repositories

⚠️ **Old Account:**
- You can keep the old account as a backup until you confirm everything works
- Remember to eventually delete the old project to save costs

### Rollback:

If needed, revert to old account:
```bash
git checkout HEAD -- apps/unified/.env backend/.env
```

---

**Migration Date:** July 11, 2026
**Status:** Configuration Updated ✅
