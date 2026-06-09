# 🔥 HOTFIX: Commission Deduction Error

## Problem
When clicking "Collected" button on trip completion, getting error:
```
❌ Commission deduction failed: 
{"code": "42703", "message": "column \"updated_at\" of relation \"trips\" does not exist"}
```

## Root Cause
The `deduct_commission()` function in the database is trying to update a non-existent `updated_at` column in the trips table.

## Solution
Apply the hotfix SQL immediately to the database.

## Steps to Apply (Choose ONE)

### Option 1: Using Supabase Dashboard (FASTEST)
1. Go to: https://supabase.com/dashboard
2. Select your project: `vofupwsnbcidjnifaihm`
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy ALL the SQL from: `newtaxi/HOTFIX_COMMISSION_UPDATED_AT.sql`
6. Paste into the SQL editor
7. Click **Run** button (top right)
8. ✅ Wait for success message

### Option 2: Using Supabase CLI
```bash
cd newtaxi
supabase db push
```

## Verification
After applying:
1. In app, complete a trip
2. Click "Yes, Money Collected" button
3. ✅ Should see "✅ Recorded" message instead of error
4. Earnings recorded in wallet

## What Changed
Removed `updated_at = NOW()` from the trips table UPDATE in the `deduct_commission()` function.

**Before (ERROR):**
```sql
UPDATE trips SET
  commission_amount = v_commission,
  updated_at = NOW()  -- ❌ Column doesn't exist
WHERE id = p_trip_id;
```

**After (FIXED):**
```sql
UPDATE trips SET
  commission_amount = v_commission  -- ✅ Only update commission
WHERE id = p_trip_id;
```
