# Migration 106: Approved Drivers Re-Upload Fix

## The Problem
When an **approved driver** re-uploads documents:
1. Documents are inserted into `driver_documents` table
2. Trigger `trg_update_overall_verification_status` fires
3. Trigger recalculates status based on document counts
4. Since new docs are `pending`, it sets `overall_status = 'pending'`
5. Driver locked out of dashboard
6. Shows "Waiting for Approval" screen

## The Solution
**Add check in trigger: If driver is ALREADY APPROVED, don't change the status**

```sql
IF current_status = 'approved'::verification_status THEN
  RETURN NEW;  -- EXIT - don't update status
END IF;
```

## How It Works

### Before (OLD - BROKEN)
```
Approved Driver Re-Uploads Document
↓
driver_documents INSERT fires trigger
↓
Trigger counts: 1 pending + 5 approved
↓
Logic: has pending → status = 'pending' ❌
↓
Driver sees "Waiting for Approval" ❌
```

### After (NEW - FIXED)
```
Approved Driver Re-Uploads Document
↓
driver_documents INSERT fires trigger
↓
Trigger checks: current_status = 'approved'? YES ✅
↓
RETURN early - don't update status
↓
overall_status stays 'approved' ✅
↓
Driver can login to dashboard ✅
```

## New Driver Flow (Unaffected)
```
New Driver First Submission
↓
driver_documents INSERT fires trigger
↓
Trigger checks: current_status = 'approved'? NO
↓
Continue normal logic
↓
Calculates status based on docs
↓
Sets status to 'pending' (first time)
↓
Works as before ✅
```

## Files to Apply

1. Copy content from: `newtaxi/APPLY_MIGRATION_106.sql`
2. Paste into Supabase SQL Editor
3. Run

## Result
- ✅ Approved drivers can re-upload documents
- ✅ `overall_status` stays `'approved'`
- ✅ Dashboard access NOT affected
- ✅ New drivers work normally
- ✅ Rejected drivers can still resubmit

## Testing

### Test 1: Approved Driver Re-Upload
```
1. Driver approved (overall_status = 'approved')
2. Re-upload document X
3. Check database: overall_status = 'approved' (unchanged) ✅
4. Driver can login to dashboard ✅
```

### Test 2: New Driver First Submission
```
1. New driver uploads documents
2. Check database: overall_status = 'pending' ✅
3. Shows "Waiting for Approval" screen ✅
```

### Test 3: Rejected Driver Resubmit
```
1. Driver rejected (overall_status = 'rejected')
2. Re-upload document
3. Check database: overall_status = 'pending' (changed) ✅
4. Shows "Waiting for Approval" screen ✅
```

## Status
✅ READY - Apply this migration to fix the issue
