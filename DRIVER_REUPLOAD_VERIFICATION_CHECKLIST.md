# Driver Re-Upload Fix - Verification Checklist

## Pre-Deployment

### Code Review
- [x] Database migration 105 created: `105_preserve_approval_on_re_verification.sql`
- [x] DriverNavigator updated with real-time subscription
- [x] Backend document upload verified (no changes to overall_status)
- [x] WaitingForApprovalScreen polling logic verified
- [x] No breaking changes to frontend

### Database
- [x] Migration follows migration naming convention
- [x] SQL syntax validated
- [x] Trigger logic reviewed
- [x] Backward compatible (doesn't affect existing approved drivers)
- [x] Rollback strategy identified

## Deployment Steps

### Step 1: Apply Database Migration
```
File: newtaxi/APPLY_MIGRATION_105.sql
```
1. Open Supabase Dashboard → SQL Editor
2. Copy content from `newtaxi/APPLY_MIGRATION_105.sql`
3. Paste into SQL Editor
4. Run the migration
5. Verify: Check for "Trigger trg_update_overall_verification_status exists" message

### Step 2: Restart Backend & Frontend
```bash
# Backend
node backend/index.js

# Frontend (React Native)
npm start
```

### Step 3: Testing

#### Test A: New Driver Approval Flow (Not Affected)
1. Create new driver account
2. Upload all 6 documents
3. Verify: `overall_status = 'pending'` in database
4. Admin approves all documents
5. Verify: `overall_status = 'approved'`
6. Expected: Dashboard accessible ✅

#### Test B: Approved Driver Re-Upload (MAIN TEST)
1. Use approved driver (or complete test A first)
2. Go to Profile → Upload Documents
3. Re-upload 1 document (e.g., DL)
4. Verify in database:
   - New document: `status = 'pending'`
   - Overall status: `overall_status = 'approved'` ✅ (NOT reverted to pending)
   - Flag: `is_re_verification = TRUE`
5. Expected: Dashboard still accessible, no "Waiting for Approval" screen ✅

#### Test C: Real-Time Detection
1. Have driver on dashboard (after approval)
2. Open admin screen in another tab
3. Approve/reject driver in admin screen
4. Expected: Driver sees change within 1-2 seconds ✅
5. If not immediately: Verify real-time subscription in browser console

#### Test D: Admin Re-Review
1. After driver re-uploads (Test B)
2. Go to Admin → Verify Vendors → Select driver
3. Click to view re-submitted document
4. Approve the re-submitted document
5. Verify: `overall_status = 'approved'`, `is_re_verification = TRUE`
6. Driver dashboard still accessible ✅

#### Test E: Rejection After Re-Upload
1. After driver re-uploads (Test B)
2. Go to Admin → Verify Vendors → Select driver
3. Reject the re-submitted document
4. Verify in database: `overall_status = 'rejected'`
5. Expected: Driver sees "Documents Rejected" screen ✅
6. Driver can re-upload → cycle continues

### Step 4: Log Verification

**Expected Console Logs** (in driver app):
```
✅ After approval:
  DriverNavigator: Verification status found: approved
  DriverNavigator: Driver approved - showing dashboard

✅ After re-upload:
  DriverNavigator: Real-time verification status update: {...}
  DriverNavigator: Polling verification status (fallback)...
  DriverNavigator: Driver approved - showing dashboard

✅ After admin rejects re-submission:
  DriverNavigator: Real-time verification status update: {...}
  DriverNavigator: Documents pending review - showing waiting screen
```

## Post-Deployment

### Monitoring
- [ ] Check error logs for any trigger-related errors
- [ ] Verify no spike in database query times
- [ ] Confirm real-time subscriptions connecting (check Supabase realtime usage)
- [ ] Monitor for any OTP login issues (real-time subscription with AsyncStorage)

### Documentation
- [ ] Update release notes with fix description
- [ ] Add FAQ: "Can I re-upload documents after approval?" → Yes!
- [ ] Update admin documentation on re-verification process

### Regression Tests
- [ ] Approved drivers can accept trips ✅
- [ ] Approved drivers can complete trips ✅
- [ ] Approved drivers can see wallet/history ✅
- [ ] Rejected drivers see rejection reason ✅
- [ ] Pending drivers see waiting screen ✅

## Rollback Procedure (if issues found)

### Quick Rollback
```sql
-- Restore original trigger logic (from migration 037)
CREATE OR REPLACE FUNCTION update_overall_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER := 6;
  submitted_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
  new_status verification_status;
BEGIN
  -- Simple version: just count and set status
  SELECT 
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'approved'),
    COUNT(DISTINCT document_type) FILTER (WHERE status = 'rejected'),
    COUNT(DISTINCT document_type)
  INTO approved_count, rejected_count, submitted_count
  FROM driver_documents
  WHERE driver_id = NEW.driver_id;
  
  IF rejected_count > 0 THEN
    new_status := 'rejected'::verification_status;
  ELSIF approved_count = total_required THEN
    new_status := 'approved'::verification_status;
  ELSE
    new_status := 'pending'::verification_status;
  END IF;
  
  UPDATE driver_verification_status
  SET overall_status = new_status,
      approved_at = CASE WHEN new_status = 'approved' AND approved_at IS NULL THEN NOW() ELSE approved_at END,
      rejected_at = CASE WHEN new_status = 'rejected' AND rejected_at IS NULL THEN NOW() ELSE rejected_at END
  WHERE driver_id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Known Limitations

### Preserved Issues (NOT Fixed in This Task)
- [ ] Approved drivers still need to logout/login to see some changes (handled by DriverNavigator polling)
- [ ] Real-time requires PostgreSQL extension (already enabled in Supabase)
- [ ] Polling fallback means 5-second delay if real-time fails

### Future Improvements
- [ ] Optimize polling interval (currently 5s)
- [ ] Add push notification when re-verification complete
- [ ] Frontend cache invalidation on approval change
- [ ] Batch re-verification for multiple drivers

## Sign-Off

- [ ] Code Review: Approved
- [ ] Database Migration: Tested
- [ ] Frontend Integration: Verified
- [ ] Deployment: Successful
- [ ] Post-Deployment Tests: Passed
- [ ] Ready for Production: YES/NO

---

**Notes**:
- This fix is non-breaking and backward compatible
- Existing approved drivers unaffected
- Only affects re-verification scenarios
- Can be deployed immediately without coordinating driver app updates

