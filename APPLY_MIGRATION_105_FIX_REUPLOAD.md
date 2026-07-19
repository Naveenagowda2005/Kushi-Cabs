# Fix: Preserve Approval Status During Re-Verification

## Problem
When an approved driver re-uploads documents after approval, the system incorrectly reverts their `overall_status` from `'approved'` to `'pending'`, causing:
- Driver dashboard becomes inaccessible
- Driver sees "Waiting for Approval" screen again
- Loss of approved driver access

## Root Cause
The `update_overall_verification_status()` trigger (from migration 037) automatically sets `overall_status` based on document statuses:
1. Driver is approved: all 6 documents = `approved` → `overall_status = 'approved'`
2. Driver re-uploads document A
3. New document status = `pending` (waiting for re-review)
4. Trigger fires and counts: 1 pending + 5 approved
5. Result: Sets `overall_status = 'pending'` ❌
6. Driver loses dashboard access

## Solution
Migration **105_preserve_approval_on_re_verification.sql** updates the trigger logic:
- When a driver is already `approved` AND `is_re_verification = TRUE` (flag set by migration 079)
- **Don't** revert to pending just because they have pending re-submitted docs
- Keep them approved on the dashboard while admin reviews the re-submission
- Only change status if admin explicitly rejects OR all new docs are approved

## How It Works
```sql
IF current_status = 'approved' AND is_re_verification = TRUE THEN
  -- Don't revert to pending, keep them approved
  IF new_status != 'approved' AND new_status != 'rejected' THEN
    new_status := 'approved'  -- Override back to approved
  END IF
END IF
```

## Implementation Steps

### 1. Apply Migration
Copy the SQL content and run in Supabase SQL Editor:
```
newtaxi/supabase/migrations/105_preserve_approval_on_re_verification.sql
```

OR use the CLI:
```bash
supabase migration up 105
```

### 2. Verify in Frontend
The following files already have correct logic and don't need changes:
- `DriverNavigator.js`: Real-time subscription checks `overall_status === 'approved'`
- `WaitingForApprovalScreen.js`: Polling checks status changes
- `document-upload.js`: Only uploads files, doesn't touch verification status

### 3. Test Flow
1. Driver approved: `overall_status = 'approved'`, `is_re_verification = FALSE`
2. Driver re-uploads: `is_re_verification = TRUE` (set by trigger 079)
3. New document uploaded: status = `pending`
4. Trigger fires → sees `is_re_verification = TRUE` → keeps `overall_status = 'approved'` ✅
5. Dashboard remains accessible
6. Admin can review re-submitted docs in verification screen
7. Admin approves/rejects → `overall_status` updates accordingly

## Key Points
- **Backward compatible**: Only affects drivers with `is_re_verification = TRUE`
- **New drivers unaffected**: First-time uploads follow normal pending → approved flow
- **Admin control preserved**: Admins can still approve/reject re-submissions
- **Dashboard access maintained**: Approved drivers stay approved while re-verification happens

## Related Files
- Migration: `newtaxi/supabase/migrations/105_preserve_approval_on_re_verification.sql`
- Trigger that sets is_re_verification flag: Migration 079
- Real-time subscription: `DriverNavigator.js` (added in latest update)
- Document upload: `backend/routes/document-upload.js`

## Status
✅ Migration created and ready to apply
✅ Real-time detection implemented in DriverNavigator
✅ No frontend changes needed
