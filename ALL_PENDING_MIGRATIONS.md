# ALL PENDING MIGRATIONS - Apply in Order

Your database is missing several migrations. Apply them in this exact order:

## Missing Columns That Need Migration

### Migration 036: Toll Included
**File**: `036_add_toll_included_to_trips.sql`
**Purpose**: Adds `toll_included` column
**Status**: ⏳ PENDING - **APPLY THIS FIRST**

### Migration 044: Return Date
**File**: `044_add_return_date_to_trips.sql`
**Purpose**: Adds `return_date` column
**Status**: ⏳ PENDING

### Migration 045: Display Order (Already Applied)
**File**: `045_add_order_to_trip_segments.sql`
**Purpose**: Adds `display_order` column to trip_segments
**Status**: ✅ ALREADY APPLIED

### Migration 046: State Tax & Pet Travelling
**File**: `046_add_state_tax_and_pet_to_trips.sql`
**Purpose**: Adds `state_tax_included` and `pet_travelling` columns
**Status**: ⏳ PENDING

### Migration 047: Fixed KM
**File**: `047_add_fixed_km_to_trips.sql`
**Purpose**: Adds `fixed_km` column (NOT NULL)
**Status**: ⏳ PENDING

### Migration 048: Update Car & Seater Types
**File**: `048_update_car_and_seater_types.sql`
**Purpose**: Updates car and seater type data
**Status**: ⏳ PENDING

## Apply Order (CRITICAL)

```
1. 036_add_toll_included_to_trips.sql
2. 044_add_return_date_to_trips.sql
3. 046_add_state_tax_and_pet_to_trips.sql
4. 047_add_fixed_km_to_trips.sql
5. 048_update_car_and_seater_types.sql
```

## How to Apply

### Via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy SQL from each migration file above in order
3. Run one at a time
4. Wait for each to complete before running the next

### Via Supabase CLI
```bash
supabase db push
```

## After Applying All Migrations
- Restart your app
- All new fields will be available
- Trip creation should work without errors

## Current Error Resolution
```
ERROR: Could not find the 'toll_included' column of 'trips' in the schema cache
```
**Caused by**: Migration 036 not applied
**Solution**: Apply migrations starting with 036
