# Apply Migration 095 - Add Local Packages

## What This Does
Adds standard package options for "Local trips" segment:
- 4/40kms
- 8/80kms  
- 12/120kms

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `095_add_local_packages.sql`
5. Click **Run**

### Option 2: Via Command Line
```bash
cd newtaxi
supabase db push  # if using Supabase CLI
```

## SQL Content
The migration does:
1. Inserts 3 new packages for the "Local trips" segment
2. Uses `NOT EXISTS` to prevent duplicates
3. Sets proper display order (1, 2, 3)

## Verification
After applying, check the packages appear:
- Go to Supabase Dashboard
- Query: `SELECT * FROM trip_packages WHERE segment_id IN (SELECT id FROM trip_segments WHERE name = 'Local trips')`
- Should show 3 rows with 4/40kms, 8/80kms, 12/120kms

## App Impact
Once migration is applied:
✅ "Local packages" field will show in Settings → Create Admin Trip
✅ Dropdown will display: 4/40kms, 8/80kms, 12/120kms
✅ Users can select packages when creating admin trips
