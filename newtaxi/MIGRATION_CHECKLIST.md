# Supabase Migration Checklist

## Configuration ✅
- [x] Frontend .env updated with new URL and Anon Key
- [x] Backend .env updated with new Service Role Key
- [x] Migration guide created
- [x] Step-by-step instructions prepared

## Next Steps (TO DO)

### Phase 1: Database Setup
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Navigate to project: `cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi`
- [ ] Login to Supabase: `supabase login`
- [ ] Link to new project: `supabase link --project-ref cqfsirfjwfxvwggjkrvd`
- [ ] Run all migrations: `supabase db push`
- [ ] Verify all tables created (see verification query in guide)

### Phase 2: Data Verification
- [ ] Log into Supabase dashboard
- [ ] Check tables exist:
  - [ ] users
  - [ ] vendors
  - [ ] drivers
  - [ ] trips
  - [ ] payment_orders
  - [ ] driver_documents
  - [ ] vendor_documents
  - [ ] car_types
  - [ ] seater_types
  - [ ] fuel_types
  - [ ] trip_segments
  - [ ] trip_packages
  - [ ] commission_settings
  - [ ] app_settings
  - [ ] app_policies
  - [ ] active_sessions
- [ ] Check RLS policies are enabled
- [ ] Check functions are created

### Phase 3: Application Testing
- [ ] Start backend: `npm start` (in backend folder)
- [ ] Start frontend: `npm start` (in newtaxi/apps/unified)
- [ ] Test user registration
- [ ] Test user login
- [ ] Test trip creation
- [ ] Test vendor operations
- [ ] Test driver operations
- [ ] Test payment processing
- [ ] Test admin features
- [ ] Check Supabase connection logs for errors

### Phase 4: Data Migration (If Migrating from Old Account)
- [ ] Export all data from old Supabase account
  - [ ] Export users
  - [ ] Export vendors
  - [ ] Export drivers
  - [ ] Export trips
  - [ ] Export all other tables
- [ ] Import data to new account
- [ ] Verify data integrity
- [ ] Check all relationships/foreign keys

### Phase 5: Production Ready
- [ ] All migrations completed successfully
- [ ] All features tested and working
- [ ] No errors in console or logs
- [ ] All data verified
- [ ] Backend and frontend running smoothly
- [ ] Ready for production deployment

### Phase 6: Cleanup (Optional)
- [ ] Keep old Supabase project for X days (backup)
- [ ] After confirmed everything works, deactivate old project
- [ ] Update DNS/URLs if needed
- [ ] Archive old credentials

---

## Important Credentials

### New Supabase Account
```
URL: https://cqfsirfjwfxvwggjkrvd.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTIyNDAsImV4cCI6MjA5ODgyODI0MH0.BhAbkuYzJ4KEmLM-7ItjaF2WmP4UuSZFqIaZ8ypNBEM
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I
```

### Environment Files
- Frontend: `newtaxi/apps/unified/.env`
- Backend: `backend/.env`

---

## Commands Reference

### Start Migration
```bash
cd newtaxi
supabase link --project-ref cqfsirfjwfxvwggjkrvd
supabase db push
```

### Start Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd newtaxi/apps/unified
npm start
```

### Verify Database
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## Timeline Estimate
- Database Setup: 5-10 minutes
- All Migrations: 2-5 minutes
- Data Verification: 5 minutes
- Application Testing: 15-30 minutes
- Total: ~30-50 minutes

---

## Support / Troubleshooting

See: `EXECUTE_MIGRATIONS_STEP_BY_STEP.md` for detailed troubleshooting

---

**Created:** July 11, 2026
**Status:** Ready to Execute
**Last Updated:** -
