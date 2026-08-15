# Required Database Migrations - Apply in Order

These migrations need to be applied to your Supabase database in the following order:

## 1. Migration 044: Add Return Date
**File**: `044_add_return_date_to_trips.sql`
**Purpose**: Adds `return_date` column for round trips
**Status**: ⏳ PENDING

## 2. Migration 045: Add Display Order to Trip Segments
**File**: `045_add_order_to_trip_segments.sql`
**Purpose**: Adds `display_order` column to trip_segments table (for reordering)
**Status**: ⏳ PENDING

## 3. Migration 046: Add State Tax and Pet Travelling
**File**: `046_add_state_tax_and_pet_to_trips.sql`
**Purpose**: Adds `state_tax_included` and `pet_travelling` columns
**Status**: ⏳ PENDING (This is causing your current error)

## 4. Migration 047: Add Fixed KM
**File**: `047_add_fixed_km_to_trips.sql`
**Purpose**: Adds `fixed_km` column (REQUIRED field)
**Status**: ⏳ PENDING

## 5. Migration 048: Update Car and Seater Types
**File**: `048_update_car_and_seater_types.sql`
**Purpose**: Updates car types (Sedan, SUV, INNOVA, INNOVA CRYSTA) and seater types (4+1, 6+1, 7+1)
**Status**: ⏳ PENDING

## How to Apply

### Option 1: Via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each migration SQL file in order
3. Run each migration one by one

### Option 2: Via Supabase CLI
```bash
supabase db push
```

## Columns Added

### From Migration 044
- `return_date` (TIMESTAMPTZ) - For round trip return date

### From Migration 045
- `display_order` (INTEGER) - For trip segment ordering

### From Migration 046
- `state_tax_included` (BOOLEAN) - Whether state tax is included
- `pet_travelling` (BOOLEAN) - Whether pet is travelling

### From Migration 047
- `fixed_km` (DECIMAL) - Fixed kilometers (NOT NULL, required)

## After Applying Migrations
- Restart your app
- Trip creation should work without errors
- All new fields will be available

## Current Error
```
ERROR: Could not find the 'pet_travelling' column of 'trips' in the schema cache
```
**Cause**: Migration 046 hasn't been applied yet
**Solution**: Apply migrations 044, 045, and 046 first
