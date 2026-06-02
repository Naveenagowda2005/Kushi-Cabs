# Action Plan - Document Upload Fix

## Current Status
✅ Migration applied
✅ Code fixes deployed
✅ App running on port 8081
⏳ Testing in progress

## Immediate Actions (Next 30 minutes)

### Action 1: Test Basic Upload (10 minutes)
**Goal**: Verify document upload works

**Steps**:
1. Open app (port 8081)
2. Sign up as driver with phone: 9686314982
3. Complete registration
4. Upload one document (DL)
5. Check console for logs
6. Verify success alert shown

**Success Criteria**:
- ✅ Upload shows success
- ✅ Console shows logs
- ✅ Document appears in list

**If Fails**:
- Check console for error message
- Review DOCUMENT_UPLOAD_FIX.md
- Run debug script

---

### Action 2: Verify Database (5 minutes)
**Goal**: Confirm document stored in database

**Steps**:
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Select `driver_documents` table
4. Look for new row with:
   - driver_id = your user ID
   - document_type = DL
   - status = pending

**Success Criteria**:
- ✅ Row exists in table
- ✅ Base64 data present
- ✅ Status is "pending"

**If Fails**:
- Check RLS policies in Supabase
- Verify migration was applied
- Run SQL verification commands

---

### Action 3: Test Multiple Documents (10 minutes)
**Goal**: Verify can upload all 6 documents

**Steps**:
1. Upload remaining 5 documents:
   - VEHICLE_FRONT
   - INSURANCE
   - FC
   - EMISSION
   - RC
2. Check progress bar updates (1/6 → 6/6)
3. Verify all documents in database

**Success Criteria**:
- ✅ All 6 documents upload
- ✅ Progress bar shows 6/6
- ✅ All in database

**If Fails**:
- Check for RLS errors
- Verify user authentication
- Check database permissions

---

## Short Term Actions (Next 1-2 hours)

### Action 4: Test Document Submission (15 minutes)
**Goal**: Verify submission flow works

**Steps**:
1. Click "Submit for Verification"
2. Confirm in alert
3. Verify driver logged out
4. Verify redirected to timeline
5. Check timeline shows Step 3 active

**Success Criteria**:
- ✅ Submission successful
- ✅ Driver logged out
- ✅ Timeline shows Step 3

---

### Action 5: Test Admin Approval (20 minutes)
**Goal**: Verify admin can approve documents

**Steps**:
1. Logout from driver
2. Login as Super Admin (phone: 9686314982)
3. Go to Admin Verification Dashboard
4. Find driver's documents
5. Approve all documents
6. Check timeline updates

**Success Criteria**:
- ✅ Admin can see documents
- ✅ Can approve documents
- ✅ Timeline updates to Step 5

---

### Action 6: Test Login After Approval (10 minutes)
**Goal**: Verify driver can login after approval

**Steps**:
1. Logout from admin
2. Try to login as driver (before approval)
3. Verify login rejected
4. Admin approves documents
5. Try to login as driver (after approval)
6. Verify login successful

**Success Criteria**:
- ✅ Cannot login before approval
- ✅ Can login after approval
- ✅ Access dashboard

---

## Testing Checklist

### Phase 1: Basic Upload (10 min)
- [ ] Sign up as driver
- [ ] Upload first document
- [ ] Console shows logs
- [ ] Success alert shown
- [ ] Document in list

### Phase 2: Database (5 min)
- [ ] Document in driver_documents table
- [ ] Base64 data present
- [ ] Status is pending

### Phase 3: Multiple Documents (10 min)
- [ ] Upload all 6 documents
- [ ] Progress bar updates
- [ ] All in database

### Phase 4: Submission (15 min)
- [ ] Submit documents
- [ ] Driver logged out
- [ ] Timeline shows Step 3

### Phase 5: Admin Approval (20 min)
- [ ] Admin sees documents
- [ ] Can approve documents
- [ ] Timeline updates

### Phase 6: Login (10 min)
- [ ] Cannot login before approval
- [ ] Can login after approval
- [ ] Access dashboard

**Total Time**: ~70 minutes

---

## Troubleshooting Guide

### If Upload Fails

**Error: "RLS policy violation"**
- RLS policies not updated correctly
- Solution: Re-run SQL from QUICK_FIX_GUIDE.md

**Error: "Invalid image data"**
- Image picker not working
- Solution: Try gallery instead of camera

**Error: "Network error"**
- Connection issue
- Solution: Check internet, verify Supabase URL

**Error: "Document not in database"**
- RLS policy blocking insert
- Solution: Check RLS policies, verify user auth

---

## Success Criteria

All of the following must be true:

1. **Upload Works**
   - [ ] Document uploads without error
   - [ ] Success alert shown
   - [ ] Document appears in list

2. **Database Storage**
   - [ ] Document in driver_documents table
   - [ ] Base64 data present
   - [ ] Status is pending

3. **Admin Features**
   - [ ] Admin can see documents
   - [ ] Admin can approve/reject
   - [ ] Timeline updates

4. **Login Verification**
   - [ ] Cannot login before approval
   - [ ] Can login after approval

---

## Documentation Reference

| Document | Use Case |
|----------|----------|
| QUICK_FIX_GUIDE.md | Quick reference for fix |
| DOCUMENT_UPLOAD_FIX.md | Detailed explanation |
| TEST_UPLOAD_NOW.md | Step-by-step testing |
| VERIFICATION_CHECKLIST.md | Verification steps |
| FIX_SUMMARY.md | Complete summary |

---

## Timeline

| Time | Action | Duration |
|------|--------|----------|
| Now | Test basic upload | 10 min |
| +10 | Verify database | 5 min |
| +15 | Test multiple documents | 10 min |
| +25 | Test submission | 15 min |
| +40 | Test admin approval | 20 min |
| +60 | Test login | 10 min |
| +70 | **COMPLETE** | - |

---

## Decision Points

### After Phase 1 (Basic Upload)
**If Success**: Continue to Phase 2
**If Fail**: Debug and fix, then retry

### After Phase 2 (Database)
**If Success**: Continue to Phase 3
**If Fail**: Check RLS policies, retry

### After Phase 3 (Multiple Documents)
**If Success**: Continue to Phase 4
**If Fail**: Check upload logic, retry

### After Phase 4 (Submission)
**If Success**: Continue to Phase 5
**If Fail**: Check logout logic, retry

### After Phase 5 (Admin Approval)
**If Success**: Continue to Phase 6
**If Fail**: Check admin dashboard, retry

### After Phase 6 (Login)
**If Success**: ✅ READY FOR DEPLOYMENT
**If Fail**: Debug and fix, retry

---

## Deployment Decision

### Ready for Deployment If:
- ✅ All 6 phases pass
- ✅ No errors in console
- ✅ All documents stored
- ✅ Admin can approve
- ✅ Driver can login after approval

### Not Ready If:
- ❌ Any phase fails
- ❌ Errors in console
- ❌ Documents not stored
- ❌ Admin cannot approve
- ❌ Login verification fails

---

## Next Steps

1. **Start Testing**
   - Follow TEST_UPLOAD_NOW.md
   - Upload a document
   - Check console logs

2. **Verify Each Phase**
   - Complete all 6 phases
   - Document results
   - Fix any issues

3. **Deploy**
   - If all tests pass
   - Push to production
   - Monitor for issues

---

## Support

For issues:
1. Check console logs
2. Review DOCUMENT_UPLOAD_FIX.md
3. Run debug script
4. Check Supabase RLS policies
5. Verify user authentication

---

**Status**: Ready to test
**Next Action**: Start Phase 1 - Basic Upload
**Estimated Time**: 70 minutes
