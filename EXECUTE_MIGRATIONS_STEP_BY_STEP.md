# Execute All Migrations on New Supabase Account

## Database Details
- **New Supabase URL**: `https://cqfsirfjwfxvwggjkrvd.supabase.co`
- **Project ID**: `cqfsirfjwfxvwggjkrvd`
- **Total Migrations**: 78+

## Method 1: Using Supabase Web Dashboard (EASIEST)

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
# or with yarn
yarn global add supabase
```

### Step 2: Link to New Project
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
supabase login
supabase link --project-ref cqfsirfjwfxvwggjkrvd
```

### Step 3: Push All Migrations
```bash
supabase db push
```

This will automatically run all migrations in `supabase/migrations/` folder in the correct order.

---

## Method 2: Manual SQL Execution (If CLI not available)

### Step 1: Go to Supabase Dashboard
1. Open https://cqfsirfjwfxvwggjkrvd.supabase.co
2. Go to **SQL Editor**
3. Click **New Query**

### Step 2: Execute Migrations One by One
Copy each migration file content and execute:

**Order matters! Execute in this sequence:**

1. `001_initial_schema.sql` - Base tables
2. `002_rls_policies.sql` - Security policies
3. `003_accept_trip_function.sql` - Functions
4. `004_all_functions.sql` - More functions
5. `009_roles_read_policy.sql`
6. `010_users_insert_policy.sql`
7. `011_fix_wallet_trigger.sql`
8. `012_upsert_policies.sql`
9. `013_seed_vendor.sql` - Initial data
10. `014_vendors_select_policy.sql`
11. `015_trips_insert_policy.sql`
12. `016_v2_features.sql`
13. `017_fix_trip_insert_policy.sql`
14. `018_vendor_create_trip.sql`
15. `019_add_email_to_users.sql`
16. `020_fix_all_insert_policies.sql`
17. `021_payment_orders.sql`
18. `022_driver_online_status.sql`
19. `023_add_super_admin.sql`
20. `024_seed_sample_data.sql`
21. `025_app_settings_and_fix_trigger.sql`
22. `026_add_commission_settings.sql`
23. `027_fix_deduct_commission.sql`
24. `028_add_commission_to_trips.sql`
25. `029_add_car_details_to_trips.sql`
26. `030_add_is_published_to_trips.sql`
27. `031_add_trip_segments_and_packages.sql`
28. `032_add_customer_pre_advance.sql`
29. `033_update_deduct_commission_with_preadvance.sql`
30. `034_set_default_customer_preadvance.sql`
31. `035_add_payment_gateway_to_payment_orders.sql`
32. `036_add_toll_included_to_trips.sql`
33. `037_driver_documents_verification.sql`
34. `038_add_verification_status_to_users.sql`
35. `039_driver_verification_rls_policies.sql`
36. `040_fix_document_data_type.sql`
37. `041_fix_document_status_semantics.sql`
38. `042_fix_existing_documents_status.sql`
39. `043_add_new_document_types.sql`
40. `044_add_return_date_to_trips.sql`
41. `045_add_order_to_trip_segments.sql`
42. `046_add_state_tax_and_pet_to_trips.sql`
43. `047_add_fixed_km_to_trips.sql`
44. `048_update_car_and_seater_types.sql`
45. `049_backfill_existing_trips.sql`
46. `050_backfill_segment_id.sql`
47. `051_vendor_documents_verification.sql`
48. `052_vendor_verification_rls_policies.sql`
49. `053_create_app_policies_table.sql`
50. `054_fix_app_policies_rls.sql`
51. `055_fix_vendor_insert_verification_status.sql`
52. `056_vendor_update_verification_status.sql`
53. `057_vendor_verification_rpc.sql`
54. `058_fix_deduct_commission_format.sql`
55. `059_seed_app_policies.sql`
56. `060_phonepe_payments.sql`
57. `061_fix_vendor_documents_rls.sql`
58. `062_fix_payment_orders_rls.sql` (use this OR the alternative below)
59. `063_vendor_re_verification.sql`
60. `064_add_is_re_verification_to_rpc.sql`
61. `065_fix_is_re_verification_flag.sql`
62. `066_add_hills_included_to_trips.sql`
63. `067_add_minimum_wallet_balance_setting.sql`
64. `068_vendors_super_admin_read_policy.sql`
65. `069_admin_trip_assignments.sql` (use this OR the alternative)
66. `070_add_notes_to_trips.sql` (use this OR the alternative)
67. `071_add_extra_km_charge_to_trips.sql`
68. `072_fix_driver_trip_visibility.sql`
69. `073_fix_driver_trip_visibility_comprehensive.sql`
70. `074_fix_driver_accept_vendor_assigned_trip.sql`
71. `075_fix_accept_trip_active_trip_check.sql`
72. `076_add_active_sessions_table.sql` (use this OR the alternative)
73. `077_add_vendor_trip_read_status.sql`
74. `078_add_trips_index_for_performance.sql`

### Step 3: Verify All Tables Created
After running migrations, verify:

```sql
-- Run this query to see all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- users
- vendors
- drivers
- trips
- enquiries
- payment_orders
- driver_documents
- vendor_documents
- car_types
- seater_types
- fuel_types
- trip_segments
- trip_packages
- commission_settings
- app_settings
- app_policies
- active_sessions
- And more...

---

## Method 3: Using Database URL Connection (Advanced)

If you have PostgreSQL tools installed:

```bash
# Export database URL
set PGPASSWORD=your_postgres_password

# Run psql
psql -h db.cqfsirfjwfxvwggjkrvd.supabase.co \
     -U postgres \
     -d postgres

# Then run each migration file:
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_rls_policies.sql
-- ... continue for all migrations
```

---

## After Migrations Complete

### 1. Verify Connection in App
Update app to use new credentials (already done):
- `apps/unified/.env` - Updated ✅
- `backend/.env` - Updated ✅

### 2. Test the Application
```bash
# Start backend
cd backend
npm start

# In another terminal, start frontend
cd newtaxi/apps/unified
npm start
```

### 3. Verify All Features
- User Registration/Login
- Trip Creation
- Vendor Operations
- Driver Operations
- Payment Processing
- Admin Functions

---

## Troubleshooting

### Error: "Table already exists"
Skip that migration if re-running. Use `IF NOT EXISTS` in queries.

### Error: "Foreign key constraint fails"
Make sure migrations run in order. Some tables depend on others.

### Error: "RLS policy conflict"
This is normal if re-running. Drop and recreate policies or use `ALTER POLICY` instead of `CREATE POLICY`.

### Connection Timeout
Check your internet connection and Supabase project status.

---

## Important Notes

⚠️ **Migration Order is Critical**
- Base tables must be created first (001-004)
- Functions must be created after tables
- RLS policies must be created after tables and functions
- Data seeding should happen after schema is complete

⚠️ **Data Migration**
- These migrations create empty tables with schema
- To migrate existing data from old account, use data export/import

⚠️ **Backup**
- Keep old Supabase project as backup until confirmed everything works
- Can restore from old account if needed

---

## Next Steps After Migration

1. ✅ **Migrations run** (what we're doing now)
2. ⏳ **Environment variables updated** (already done)
3. ⏳ **App tested with new database**
4. ⏳ **Data migrated from old account** (if needed)
5. ⏳ **All features verified**
6. ⏳ **Old Supabase account deactivated** (when ready)

---

**Last Updated:** July 11, 2026
**Status:** Ready for Migration Execution
