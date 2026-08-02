# 📋 VENDOR PUBLISH BUTTON - DEPLOYMENT CHECKLIST

## Pre-Deployment (1 hour)

### Code Verification
- [ ] Read the updated `src/screens/vendor/MyTripsScreen.js`
- [ ] Verify TripItem component is extracted (around line 13)
- [ ] Verify TripItem has `React.memo()` wrapper
- [ ] Verify useCallback is imported at top
- [ ] Verify handlePublishCallback is defined
- [ ] Verify FlatList uses new TripItem props structure
- [ ] Run `npm run lint` - should pass with no errors
- [ ] Check for TypeScript errors (if applicable): `npm run type-check`

### Database Verification
- [ ] Connect to Supabase dashboard
- [ ] Verify `trips` table has `is_published` column (type: BOOLEAN)
- [ ] Check default value is `false`
- [ ] Verify migration 109 was applied: 
  ```sql
  SELECT * FROM pg_migrations WHERE name = '109_create_odometer_images_bucket'
  ```

### RLS Policy Verification
- [ ] Check vendor UPDATE policy exists:
  ```sql
  SELECT tablename, policyname, qual, with_check FROM pg_policies 
  WHERE tablename = 'trips' AND policyname LIKE '%update%'
  ```
- [ ] Ensure policy allows vendors to update their own trips
- [ ] Verify drivers can SELECT published trips

### Local Testing (15 minutes)
- [ ] Clear app cache: `expo r` and hard reload
- [ ] Test publish on draft trip - badge should change to green
- [ ] Test unpublish on published trip - badge should change to orange
- [ ] Test modal shows correct button after action
- [ ] Test error handling (disconnect WiFi, then try publish)
- [ ] Watch console for logs with 🔵, ✅, ❌ prefixes
- [ ] Check no infinite loops or crashes

### Code Review
- [ ] Have team member review `MyTripsScreen.js` changes
- [ ] Get approval on React patterns used
- [ ] Verify no breaking changes to child components
- [ ] Check accessibility (ARIA labels, touch targets)

---

## Staging Deployment (30 minutes)

### Build & Deploy
- [ ] Build app for staging:
  ```bash
  cd newtaxi/apps/unified
  npm run build
  ```
- [ ] Deploy to EAS staging build:
  ```bash
  eas build --platform android --profile preview
  eas build --platform ios --profile preview
  ```
- [ ] Deploy updated backend if needed
- [ ] Update staging database with migration 109 (if not done)

### Staging Testing (QA)
- [ ] Download staging app on test device
- [ ] Run full test suite (see VENDOR_PUBLISH_QUICK_TEST_GUIDE.md)
- [ ] Test on different Android/iOS versions
- [ ] Test on slow network conditions
- [ ] Test with multiple concurrent vendors
- [ ] Monitor Sentry for errors: [Sentry Dashboard]
- [ ] Check network requests in browser DevTools
- [ ] Verify database queries in Supabase logs

### User Acceptance Testing (UAT)
- [ ] Have test vendor use staging app
- [ ] Collect feedback on button behavior
- [ ] Verify expected user experience
- [ ] Document any issues found
- [ ] Fix critical issues before production

---

## Production Deployment (1 hour)

### Pre-Production Checklist
- [ ] All staging tests pass ✅
- [ ] No critical issues found
- [ ] Team has approved code
- [ ] Backup database created
- [ ] Rollback plan documented
- [ ] On-call person identified
- [ ] Alert monitoring configured
- [ ] Deployment window scheduled

### Production Build & Deploy
- [ ] Create production build:
  ```bash
  npm run build
  ```
- [ ] Deploy to EAS production:
  ```bash
  eas build --platform android --profile production
  eas build --platform ios --profile production
  ```
- [ ] Gradual rollout: Start with 10% of users
- [ ] Wait 2 hours, monitor for crashes
- [ ] Gradually increase to 50%, then 100%
- [ ] Tag git release: `git tag v1.0.0-publish-fix`
- [ ] Push to main branch

### Database Migration
- [ ] Apply migration 109 to production (if not done):
  ```bash
  supabase migration up --linked
  ```
- [ ] Verify `is_published` column exists
- [ ] Verify all existing trips have `is_published = false`

### Post-Deployment Monitoring (1 hour)
- [ ] Monitor error rate for spikes
- [ ] Check Sentry/Crashlytics for new errors
- [ ] Monitor database performance (queries, timeouts)
- [ ] Monitor network requests (failures, latency)
- [ ] Check app analytics for usage patterns
- [ ] Monitor vendor feedback (chat, support tickets)

### Rollback Plan (If Issues Found)
If critical issues found:
1. [ ] Stop rollout immediately
2. [ ] Revert to previous version in EAS
3. [ ] Notify vendors of temporary issue
4. [ ] Investigate root cause
5. [ ] Fix and re-test
6. [ ] Schedule new deployment

---

## Post-Deployment (Next 24 Hours)

### Day 1 Monitoring
- [ ] Monitor error rates continuously
- [ ] Check user support tickets
- [ ] Review console logs for warnings
- [ ] Verify all tests still passing
- [ ] Check database performance metrics
- [ ] Monitor API response times
- [ ] Review network request patterns
- [ ] Check for any data inconsistencies

### Vendor Feedback Collection
- [ ] Email vendors asking for feedback
- [ ] Monitor support channels for complaints
- [ ] Quick response to any issues
- [ ] Document improvements for v1.1
- [ ] Celebrate successful deployment! 🎉

### Performance Analysis
- [ ] Compare publish/unpublish duration (target: 1-2 seconds)
- [ ] Measure FlatList re-render performance
- [ ] Check memory usage (should not increase)
- [ ] Verify no memory leaks

### Documentation Update
- [ ] Update release notes
- [ ] Add to changelog
- [ ] Document any known issues
- [ ] Update support documentation
- [ ] Add to team wiki

---

## Success Criteria

Deployment is successful if:
- ✅ No critical errors in production (>99.9% success rate)
- ✅ Badge updates immediately when publish/unpublish
- ✅ Zero vendor complaints about button not working
- ✅ Database consistency maintained
- ✅ Performance metrics improved (50% faster)
- ✅ All tests passing
- ✅ User experience smooth and responsive

---

## Monitoring Commands

### Check Error Rate
```bash
# In browser console on app
fetch('https://api.example.com/analytics/publish-errors').then(r => r.json())
```

### Check Database Performance
```sql
-- Slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Trip updates per minute
SELECT COUNT(*) FROM trips 
WHERE updated_at > NOW() - interval '1 minute'
AND "is_published" != 'false';
```

### Check Network Issues
```bash
# In browser DevTools Network tab
# Filter: publish
# Watch for:
# - Red (failed) requests
# - Long loading times
# - Timeouts
```

---

## Escalation Contacts

| Issue | Contact | Phone |
|-------|---------|-------|
| Critical error | Backend team | xxx-xxx-xxxx |
| Database issue | DevOps | xxx-xxx-xxxx |
| User complaint | Support manager | xxx-xxx-xxxx |
| UI bug | Frontend lead | xxx-xxx-xxxx |
| Emergency rollback | Engineering lead | xxx-xxx-xxxx |

---

## Timeline

| Time | Activity | Owner | Status |
|------|----------|-------|--------|
| T-1h | Code review | Tech lead | [ ] |
| T-0h | Build app | DevOps | [ ] |
| T+0h | Deploy staging | DevOps | [ ] |
| T+30m | Staging tests | QA | [ ] |
| T+1h | Deploy production | DevOps | [ ] |
| T+1.5h | Monitor alerts | On-call | [ ] |
| T+24h | Day-1 review | Team | [ ] |

---

## Files Changed Summary

| File | Changes | Impact |
|------|---------|--------|
| `src/screens/vendor/MyTripsScreen.js` | 50 lines modified | High - Core functionality |
| Database schema | N/A (migration 109 pre-existing) | Low |
| RLS policies | N/A (already correct) | Low |
| Other files | None | N/A |

---

## Version Information

| Item | Value |
|------|-------|
| Feature | Vendor Publish Button Fix |
| Version | 1.0 |
| Release Date | $(date) |
| Breaking Changes | None |
| Database Migration | 109 (pre-existing) |
| Rollback Window | 4 hours |

---

## Final Sign-Off

- [ ] Code review approved by: _______________
- [ ] QA testing completed by: _______________
- [ ] Deployment approved by: _______________
- [ ] On-call confirmed by: _______________
- [ ] Ready for production deployment: _______________

---

## Additional Notes

```
Use this space to add any additional notes or observations:

- 
- 
- 
```

---

**Deployment Status**: Ready ✅
**Risk Level**: Low (React optimization only, no data structure changes)
**Rollback Risk**: Very Low (completely reversible)
**Estimated Rollout Time**: 2 hours
**Monitoring Duration**: 24 hours minimum
