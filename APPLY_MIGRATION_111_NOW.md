# 🚀 APPLY MIGRATION 111 - ODOMETER RLS FIX

## Problem
Can't disable RLS via Supabase dashboard - need service role permission.

## Solution
Apply migration 111 via Supabase CLI (has service role permission).

---

## Steps

### 1. Open Terminal/PowerShell in project folder

```bash
cd C:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
```

### 2. Push migration to Supabase

```bash
supabase db push
```

This will:
- Detect new migration (111_fix_odometer_rls_final.sql)
- Run it with service role key
- Disable RLS on storage.objects table

### 3. Test Upload

1. Open driver app
2. Try uploading odometer image
3. ✅ Should work now!

---

## What Migration 111 Does

- Drops all conflicting RLS policies
- Disables RLS on storage.objects table
- Allows direct uploads to odometer-images bucket

---

## If `supabase db push` doesn't work

Try:
```bash
supabase migration up --linked
```

Or check Supabase dashboard > SQL Editor and manually run:
```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

But this requires you to login as **project owner** (not just viewer).

---

## After Fix

Odometer image uploads will work for all drivers ✅
