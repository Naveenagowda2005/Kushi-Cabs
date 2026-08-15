# Vendor Verification System - Deployment Checklist

## Pre-Deployment (Developer)

### Code Review
- [ ] Read `VENDOR_VERIFICATION_IMPLEMENTATION.md`
- [ ] Review all new screen files
- [ ] Check navigation changes
- [ ] Verify no merge conflicts
- [ ] Run linter on new files

### Testing Environment Setup
- [ ] Clone latest code
- [ ] Install dependencies: `npm install`
- [ ] Build locally: `npm run build`
- [ ] Test on simulator/emulator

### Database Preparation
- [ ] Backup current database
- [ ] Review migration SQL file
- [ ] Test migration on staging database
- [ ] Verify no data loss
- [ ] Check indexes created
- [ ] Confirm triggers installed

## Deployment Phase

### Step 1: Database Migration
- [ ] Access Supabase dashboard
- [ ] Open SQL Editor
- [ ] Copy SQL from: `supabase/migrations/051_vendor_documents_verification.sql`
- [ ] Execute migration
- [ ] Verify no errors
- [ ] Check tables created:
  - [ ] `vendor_documents` exists
  - [ ] `vendor_verification_status` exists
  - [ ] Enum `vendor_document_type` created
  - [ ] Trigger `trg_sync_vendor_verification_status` created
- [ ] Verify indexes created
- [ ] Test SELECT on new tables (should return empty)

### Step 2: Storage Setup
- [ ] Go to Supabase → Storage
- [ ] Create new bucket: `vendor-documents`
- [ ] Set to public (not private)
- [ ] Verify bucket appears in list
- [ ] Test bucket access from app (if possible)
- [ ] Set CORS policy (if needed)

### Step 3: Code Deployment
- [ ] Merge code to production branch
- [ ] Build production version
- [ ] For Expo:
  - [ ] Run: `eas build --platform all`
  - [ ] Wait for build completion
  - [ ] Test on both iOS and Android
  - [ ] Run: `eas submit` (if auto-deploying)
- [ ] For native build:
  - [ ] Update version number
  - [ ] Build APK/IPA
  - [ ] Sign with production keys
  - [ ] Upload to app store

### Step 4: Release to Users
- [ ] Release to app store
- [ ] Make visible to beta testers first
- [ ] Monitor crash reports
- [ ] Check error logs
- [ ] Wait 24 hours before full release (if beta)
- [ ] Full release to all users

## Post-Deployment Testing

### Vendor Flow Testing
- [ ] Create test vendor account
- [ ] Go through complete signup
- [ ] Upload all 4 documents:
  - [ ] Aadhar card
  - [ ] PAN card
  - [ ] Bank passbook
  - [ ] Selfie
- [ ] Verify "Submit for Verification" button appears
- [ ] Click submit
- [ ] Verify redirected to waiting screen
- [ ] Check database records created:
  - [ ] `vendor_documents` has entry
  - [ ] `vendor_verification_status` has entry with status='pending'
  - [ ] `users` table verification_status updated
- [ ] Verify polling is working (check network tab)
- [ ] Wait 5+ seconds to see polling requests

### Admin Flow Testing
- [ ] Login as super admin
- [ ] Navigate to "Vendor Verif" tab
- [ ] Verify test vendor appears in pending list
- [ ] Click vendor to see details
- [ ] Verify vendor information displays
- [ ] Click on document thumbnails
- [ ] Verify full-size document viewer opens
- [ ] Approve the vendor
- [ ] Check database updated:
  - [ ] overall_status = 'approved'
  - [ ] approved_at timestamp set
  - [ ] verified_by = admin user id
- [ ] Check vendor user status synced:
  - [ ] users.verification_status = 'approved'
- [ ] Logout and login as test vendor
- [ ] Verify vendor sees "Account Approved"
- [ ] Verify redirected to vendor dashboard
- [ ] Verify can create trip enquiries
- [ ] Verify access to all vendor features

### Rejection Flow Testing
- [ ] Create another test vendor account
- [ ] Go through signup and document upload
- [ ] Login as super admin
- [ ] Find pending vendor in list
- [ ] Click "Reject"
- [ ] Enter rejection reason: "Documents not clear"
- [ ] Confirm rejection
- [ ] Check database:
  - [ ] overall_status = 'rejected'
  - [ ] rejection_reason stored
  - [ ] rejected_at timestamp set
- [ ] Logout and login as vendor
- [ ] Verify vendor sees "Application Rejected"
- [ ] Verify rejection reason is displayed
- [ ] Verify vendor cannot access dashboard

### Admin Dashboard Testing
- [ ] Test all three tabs:
  - [ ] Pending tab shows pending vendors only
  - [ ] Approved tab shows approved vendors only
  - [ ] Rejected tab shows rejected vendors with reasons
- [ ] Test pull-to-refresh functionality
- [ ] Test document viewer on all tabs
- [ ] Test empty state message when no vendors
- [ ] Test pagination (if many vendors)

### Error Handling Testing
- [ ] Test with poor network connection
- [ ] Test upload failure (simulate by blocking storage)
- [ ] Test database query failure (if possible)
- [ ] Verify error messages are user-friendly
- [ ] Verify no crashes occur
- [ ] Check error logs in Supabase

## Performance Testing

### Upload Performance
- [ ] Test upload speed (typical image size)
- [ ] Verify no timeout issues
- [ ] Test with larger files (5MB+)
- [ ] Monitor storage bucket size
- [ ] Check database query speed

### Polling Performance
- [ ] Monitor CPU/memory during polling
- [ ] Verify battery drain is minimal
- [ ] Check network traffic (should be < 1KB per request)
- [ ] Test with multiple polling screens open
- [ ] Verify cleanup on unmount (no memory leaks)

### Database Performance
- [ ] Query vendor_verification_status (should be < 500ms)
- [ ] Query vendor_documents (should be < 500ms)
- [ ] Check index effectiveness
- [ ] Monitor slow queries in Supabase

## Security Testing

### Authentication Testing
- [ ] Verify only authenticated users can upload
- [ ] Verify unauthenticated users get blocked
- [ ] Test token expiration handling
- [ ] Verify session persists correctly

### Authorization Testing
- [ ] Verify only super_admin can approve/reject
- [ ] Test with vendor account (should not see admin tab)
- [ ] Test with driver account (should not see admin tab)
- [ ] Test with regular user account

### Storage Testing
- [ ] Verify documents are publicly readable (intentional)
- [ ] Test if vendor can access other vendor's docs
- [ ] Verify file permissions are correct
- [ ] Test CORS policy

### Data Validation
- [ ] Test uploading non-image files (should fail)
- [ ] Test uploading very large files (should fail)
- [ ] Test invalid document types (should fail)
- [ ] Test SQL injection attempts (should fail)

## Monitoring Setup

### Set Up Alerts
- [ ] Database errors alert
- [ ] Storage upload failures alert
- [ ] High polling rate alert (> 1 per second)
- [ ] Migration failure alert
- [ ] Trigger failure alert

### Create Dashboards
- [ ] Monitor vendor signups
- [ ] Monitor document uploads
- [ ] Monitor approvals/rejections
- [ ] Monitor error rates
- [ ] Monitor API response times

### Enable Logging
- [ ] Log all vendor registrations
- [ ] Log all document uploads
- [ ] Log all approvals/rejections
- [ ] Log all errors
- [ ] Set log retention to 30 days

## Documentation

### User Documentation
- [ ] Create vendor signup guide
- [ ] Create admin verification guide
- [ ] Add FAQs about verification
- [ ] Create troubleshooting guide

### Internal Documentation
- [ ] Document database schema
- [ ] Document API endpoints (if any)
- [ ] Document error codes
- [ ] Create runbook for common issues

### Update README
- [ ] Add section on vendor verification
- [ ] Add setup instructions
- [ ] Add troubleshooting section

## Support Preparation

### Create Support Resources
- [ ] Write knowledge base articles
- [ ] Create FAQ document
- [ ] Write email templates (approval/rejection)
- [ ] Create SMS templates (if using SMS)

### Train Support Team
- [ ] Explain vendor verification flow
- [ ] Explain how admin approves/rejects
- [ ] Provide troubleshooting guide
- [ ] Practice common support scenarios

### Create Escalation Paths
- [ ] Define what issues need dev team
- [ ] Define what issues need product team
- [ ] Define response time SLAs
- [ ] Set up support communication channel

## Rollback Plan (Keep Ready)

### If Issues Found (First 24 hours)
- [ ] Don't panic - problems are normal
- [ ] Check logs first
- [ ] Identify specific issue
- [ ] Try fix without rollback first
- [ ] Only rollback if unfixable

### Full Rollback Steps
1. [ ] Revert app to previous version
2. [ ] Drop new tables (keep or don't?)
3. [ ] Disable vendor document upload flow
4. [ ] Notify users of issue
5. [ ] Investigate root cause
6. [ ] Fix and redeploy

### Partial Rollback
- [ ] Keep database changes
- [ ] Revert app code only
- [ ] Easier to redeploy fix

## Post-Deployment Monitoring (Next 7 Days)

### Daily Checks
- [ ] Check error logs
- [ ] Monitor vendor signups
- [ ] Monitor admin activity
- [ ] Check database size growth
- [ ] Check storage usage
- [ ] Monitor API response times
- [ ] Check for crashes/exceptions

### Weekly Review
- [ ] Analyze user feedback
- [ ] Review any bug reports
- [ ] Check performance metrics
- [ ] Plan any urgent fixes
- [ ] Update documentation as needed

### Performance Optimization
- [ ] Adjust polling interval if needed
- [ ] Optimize images if file size high
- [ ] Add caching if response slow
- [ ] Index optimization if queries slow

## Sign-Off

### Deployment Lead
- [ ] Name: ________________
- [ ] Date: _________________
- [ ] Signature: ___________

### Testing Lead
- [ ] Name: ________________
- [ ] Date: _________________
- [ ] Signature: ___________

### Product Manager
- [ ] Name: ________________
- [ ] Date: _________________
- [ ] Signature: ___________

---

## Quick Reference

### Rollback Command (if needed)
```sql
-- Drop new tables (be careful!)
DROP TABLE vendor_verification_status CASCADE;
DROP TABLE vendor_documents;
DROP TYPE vendor_document_type;
DROP FUNCTION sync_vendor_verification_status() CASCADE;
```

### Test Vendor Credentials
- Phone: 9876543210 (use any 10 digits)
- Password: OTP-9876543210-kushicabs (auto-generated)

### Test Admin Credentials
- Email: admin@kushicabs.com
- Password: [Your setup password]

### Emergency Contact
- Dev Lead: _____________
- Ops Lead: _____________
- Product Manager: _______

### Useful Links
- Supabase Dashboard: https://app.supabase.com
- App Store Dashboard: https://appstoreconnect.apple.com (iOS)
- Google Play Console: https://play.google.com/console (Android)
- Error Tracking: [Your error service link]
- Analytics Dashboard: [Your analytics link]

---

## Notes for Deployment Team

1. **Timing:** Best to deploy during low-traffic hours (e.g., 2-4 AM)
2. **Communication:** Notify users about the change before deploying
3. **Testing:** Thoroughly test all flows before production
4. **Monitoring:** Watch logs closely for first 24 hours
5. **Rollback:** Have rollback plan ready but only use if critical
6. **Feedback:** Gather user feedback and iterate quickly

Good luck! 🚀
