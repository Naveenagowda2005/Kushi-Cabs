# Dummy Vendor Feature - Setup & Testing Checklist ✅

## Pre-Implementation Checklist
- [x] Backend API endpoints created (`POST /admin/create-dummy-vendor`, `GET /admin/dummy-vendors`)
- [x] Frontend state variables added for dummy vendors
- [x] Frontend functions added (`fetchDummyVendors`, `handleCreateDummyVendor`)
- [x] UI component added to settings screen
- [x] Styling consistent with existing features
- [x] Error handling implemented

## Testing Checklist

### 1. Backend Testing
```bash
# Test 1: Create Dummy Vendor
POST http://localhost:3000/admin/create-dummy-vendor
Body: {
  "phone": "9876543210",
  "companyName": "Test Vendor Company"
}
# Expected: Success response with vendor details

# Test 2: List Dummy Vendors
GET http://localhost:3000/admin/dummy-vendors
# Expected: Array of dummy vendors with DUMMY- registration numbers

# Test 3: Reuse Same Phone
POST http://localhost:3000/admin/create-dummy-vendor
Body: {
  "phone": "9876543210",
  "companyName": "Reused Vendor"
}
# Expected: Success with reused auth account
```

### 2. Frontend UI Testing
- [ ] Super admin can navigate to Settings screen
- [ ] "Emergency Dummy Vendors" card is visible
- [ ] Expand/collapse button works
- [ ] Form shows phone and company name inputs
- [ ] Phone input accepts only digits (maxLength=10)
- [ ] "Create Dummy Vendor" button works
- [ ] Loading spinner shows while creating
- [ ] Success alert displays with vendor info
- [ ] Form clears after successful creation
- [ ] Vendor list refreshes automatically
- [ ] Can create multiple vendors

### 3. Functional Testing
- [ ] Created dummy vendor can log in with phone number
- [ ] OTP verification works for dummy vendor
- [ ] Dummy vendor appears in VendorNavigator (approved flow)
- [ ] No document verification required
- [ ] Dummy vendor can accept trips immediately
- [ ] Dummy vendor shows in admin vendor list
- [ ] Reusing same phone number resets account properly

### 4. UI/UX Testing
- [ ] Blue color scheme (#2196F3) distinguishes from drivers
- [ ] Business icon used for vendors (vs person-add for drivers)
- [ ] Status badges display correctly
- [ ] List is empty message shows when no vendors exist
- [ ] Loading state shows "Loading..."
- [ ] Form validation shows error for invalid phone
- [ ] Responsive on mobile/tablet sizes
- [ ] Consistent with existing super admin screens

### 5. Data Integrity Testing
- [ ] Users table has vendor role_id
- [ ] Users table has verification_status = "approved"
- [ ] Vendors table has registration_number = "DUMMY-{phone}"
- [ ] Vendors table has is_approved = true
- [ ] vendor_verification_status table has overall_status = "approved"
- [ ] All timestamps are correct

### 6. Error Handling Testing
- [ ] Invalid phone (< 10 digits) shows error
- [ ] Invalid phone (> 10 digits) shows error
- [ ] Empty phone shows error
- [ ] Network error shows alert
- [ ] Missing company name uses auto-generated name
- [ ] Duplicate phone reuses existing account

## Deployment Checklist

### Before Deploying to Production:
- [ ] Verify backend service key is configured
- [ ] Test with actual database
- [ ] Verify RLS policies don't block vendor access
- [ ] Test auth account creation permissions
- [ ] Verify super admin authorization is in place
- [ ] Add audit logging for dummy account creation (optional)

### Deployment Steps:
1. **Backend:**
   ```bash
   # Restart backend server
   npm restart  # or appropriate restart command
   ```

2. **Frontend:**
   ```bash
   # Rebuild React Native app
   eas build --platform ios   # for iOS
   eas build --platform android # for Android
   ```

3. **Verification:**
   - [ ] Super admin can access settings
   - [ ] Dummy vendor section loads without errors
   - [ ] Can create test vendor
   - [ ] Test vendor can log in

## Rollback Plan (if needed)
If issues occur:

1. **Remove UI (Frontend):**
   - Comment out the dummy vendor card section in SettingsScreen.js
   - Rebuild and deploy

2. **Disable API (Backend):**
   - Disable routes in admin.js with early return
   ```javascript
   router.post('/create-dummy-vendor', (req, res) => {
     res.status(503).json({ error: 'Feature temporarily disabled' });
   });
   ```

3. **Remove Data (Optional):**
   - Delete vendors with registration_number LIKE 'DUMMY-%'
   - Delete corresponding users and verification records

## Success Criteria

✅ **Feature is considered successful when:**

1. Super admin can create dummy vendor in one click
2. Dummy vendor phone appears correctly in the list
3. Dummy vendor can log in and use app immediately
4. No errors in browser console or server logs
5. All database records are created correctly
6. Feature matches UX of existing dummy driver feature
7. Responsive design works on all screen sizes

## Post-Deployment Monitoring

- [ ] Monitor server logs for any errors in vendor creation
- [ ] Check database for orphaned vendor records
- [ ] Verify RLS policies are not blocking vendor access
- [ ] Monitor performance with multiple dummy vendors
- [ ] Collect user feedback on UX/functionality

## Documentation Updates Needed

- [ ] Update Super Admin user guide
- [ ] Add to API documentation
- [ ] Update release notes
- [ ] Add to support/troubleshooting docs

---

**Last Updated:** June 29, 2026
**Status:** Ready for Testing
