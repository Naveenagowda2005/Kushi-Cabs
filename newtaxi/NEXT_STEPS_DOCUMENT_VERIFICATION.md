# Document Verification System - Next Steps

## Immediate Actions Required

### 1. Apply Database Migrations (CRITICAL)
These migrations must be applied to your Supabase database:

**Location:** `newtaxi/supabase/migrations/`
- `037_driver_documents_verification.sql`
- `038_add_verification_status_to_users.sql`
- `039_driver_verification_rls_policies.sql`

**How to Apply:**
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Execute in order (037 → 038 → 039)

### 2. Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `documents`
4. Set to **Public** (important for document URLs)
5. Click Create

### 3. Test the Implementation
1. Start the app: `npx expo start --port 8081`
2. Test as Driver:
   - Navigate to Profile → Upload Documents
   - Upload all 6 documents
   - Submit for verification
   - Check verification status
3. Test as Admin:
   - Navigate to Verification tab
   - View pending verifications
   - Approve/reject documents

## Integration Points

### Driver Registration Flow
After driver signup, add this navigation:
```javascript
// In your signup completion handler
navigation.navigate('DriverDocumentUpload');
```

### Driver Login Check
Before allowing driver to access dashboard:
```javascript
const { data: verificationStatus } = await supabase
  .from('driver_verification_status')
  .select('overall_status')
  .eq('driver_id', userId)
  .single();

if (verificationStatus?.overall_status !== 'approved') {
  navigation.navigate('DriverVerificationStatus');
  return;
}
```

### Update User Status
When all documents are approved (automatic via trigger):
```javascript
// This happens automatically, but you can verify:
const { data: user } = await supabase
  .from('users')
  .select('verification_status')
  .eq('id', driverId)
  .single();

// Should be 'approved' when all documents are approved
```

## File Locations

### Services
- `src/services/documentService.js` - All document operations

### Components
- `src/components/DocumentUploadCard.js` - Document card
- `src/components/DocumentViewer.js` - Document preview

### Screens
- `src/screens/driver/DriverDocumentUploadScreen.js` - Driver upload
- `src/screens/driver/DriverVerificationStatusScreen.js` - Driver status
- `src/screens/superadmin/AdminVerificationDashboard.js` - Admin verification

### Navigation
- `src/navigation/DriverNavigator.js` - Updated with document screens
- `src/navigation/SuperAdminNavigator.js` - Updated with verification tab

## Testing Scenarios

### Scenario 1: Driver Upload
1. Login as driver
2. Go to Profile → Upload Documents
3. Upload all 6 documents
4. Submit for verification
5. Verify documents appear in admin dashboard

### Scenario 2: Admin Approval
1. Login as super admin
2. Go to Verification tab
3. Expand driver card
4. Approve all documents
5. Verify driver status changes to 'active'

### Scenario 3: Document Rejection
1. Login as super admin
2. Go to Verification tab
3. Reject a document with reason
4. Verify driver sees rejection reason
5. Driver re-uploads document
6. Admin approves re-uploaded document

### Scenario 4: Driver Login After Approval
1. Driver completes document verification
2. Driver logs out
3. Driver logs back in
4. Verify driver can access dashboard

## Customization Options

### Change Required Documents
Edit `REQUIRED_DOCUMENTS` in screens:
```javascript
const REQUIRED_DOCUMENTS = ['DL', 'VEHICLE_FRONT', 'INSURANCE', 'FC', 'EMISSION', 'RC'];
```

### Change Image Quality
In `documentService.js`:
```javascript
const options = {
  quality: 0.7, // Change this (0-1)
};
```

### Change Colors
All colors in `src/constants.js`:
```javascript
COLORS = {
  primary: '#9333ea',
  success: '#22c55e',
  error: '#ef4444',
  // ... etc
}
```

## Troubleshooting

### "Unable to resolve module" errors
- Ensure all files are created in correct locations
- Check file paths match imports
- Restart Expo server

### Storage bucket not found
- Verify bucket name is exactly `documents`
- Verify bucket is set to Public
- Check Supabase project is correct

### Documents not uploading
- Check network connectivity
- Verify storage bucket exists and is public
- Check user is authenticated
- Review browser console for errors

### Admin dashboard shows no verifications
- Verify migrations were applied
- Check driver_verification_status table exists
- Verify user has super_admin role
- Check database permissions

## Performance Tips

1. **Compress images** - Already done at 70% quality
2. **Use pagination** - For admin dashboard with many drivers
3. **Cache data** - Locally cache document list
4. **Lazy load** - Document previews load on demand
5. **Optimize queries** - Use proper indexes (already done)

## Security Checklist

- [ ] RLS policies applied to all tables
- [ ] Storage bucket set to public
- [ ] Only drivers can upload their documents
- [ ] Only admins can approve/reject
- [ ] Rejection reasons logged
- [ ] All operations timestamped
- [ ] User status synced correctly

## Monitoring & Logging

### Key Metrics to Monitor
- Document upload success rate
- Average verification time
- Rejection rate by document type
- Admin approval time

### Logs to Check
- Supabase function logs
- Storage upload logs
- Database trigger logs
- App console logs

## Future Enhancements

1. **Email Notifications**
   - Notify driver when documents approved/rejected
   - Notify admin of new submissions

2. **Push Notifications**
   - Real-time updates for drivers
   - Admin alerts for new submissions

3. **Document Expiry**
   - Track document expiration dates
   - Auto-request renewal

4. **OCR Validation**
   - Automated document validation
   - Extract data from documents

5. **Biometric Verification**
   - Face matching with driver license
   - Liveness detection

6. **Audit Logging**
   - Track all admin actions
   - Generate compliance reports

## Support Resources

- **Documentation:** `DOCUMENT_VERIFICATION_README.md`
- **Integration Guide:** `DOCUMENT_VERIFICATION_INTEGRATION.md`
- **Implementation Details:** `DOCUMENT_VERIFICATION_IMPLEMENTATION.md`
- **Supabase Docs:** https://supabase.com/docs
- **React Native Docs:** https://reactnative.dev/docs

## Quick Command Reference

```bash
# Start the app
npx expo start --port 8081

# Run linter
npm run lint

# Run tests (if configured)
npm test

# Build for production
eas build --platform android
eas build --platform ios
```

## Contact & Support

For issues or questions:
1. Check the documentation files
2. Review component code comments
3. Check Supabase dashboard for errors
4. Review app console logs
5. Test on physical device if simulator issues

---

**Status:** ✅ Ready for Implementation
**Last Updated:** June 1, 2026
**Version:** 1.0.0
