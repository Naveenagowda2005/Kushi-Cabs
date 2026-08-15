# Document Verification System - Integration Guide

## Quick Start

This guide walks you through integrating the driver document verification system into your React Native app.

## Files Created

### Components (2 files)
1. **DocumentUploadCard.js** - Reusable card for individual document uploads
2. **DocumentViewer.js** - Modal viewer for document preview

### Screens (3 files)
1. **DriverDocumentUploadScreen.js** - Driver upload interface
2. **DriverVerificationStatusScreen.js** - Driver status tracking
3. **AdminVerificationDashboard.js** - Admin verification interface

### Services (1 file)
1. **documentService.js** - Utility functions for document operations

### Documentation (2 files)
1. **DOCUMENT_VERIFICATION_README.md** - Complete documentation
2. **DOCUMENT_VERIFICATION_INTEGRATION.md** - This file

## Step 1: Database Setup

Run this SQL in your Supabase SQL editor to create the required table:

```sql
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Driver License
  dl_url TEXT,
  dl_status TEXT DEFAULT 'pending',
  dl_uploaded_at TIMESTAMP,
  dl_approved_at TIMESTAMP,
  dl_rejected_at TIMESTAMP,
  dl_rejection_reason TEXT,
  
  -- Vehicle Front
  vehicle_front_url TEXT,
  vehicle_front_status TEXT DEFAULT 'pending',
  vehicle_front_uploaded_at TIMESTAMP,
  vehicle_front_approved_at TIMESTAMP,
  vehicle_front_rejected_at TIMESTAMP,
  vehicle_front_rejection_reason TEXT,
  
  -- Insurance
  insurance_url TEXT,
  insurance_status TEXT DEFAULT 'pending',
  insurance_uploaded_at TIMESTAMP,
  insurance_approved_at TIMESTAMP,
  insurance_rejected_at TIMESTAMP,
  insurance_rejection_reason TEXT,
  
  -- Fitness Certificate
  fc_url TEXT,
  fc_status TEXT DEFAULT 'pending',
  fc_uploaded_at TIMESTAMP,
  fc_approved_at TIMESTAMP,
  fc_rejected_at TIMESTAMP,
  fc_rejection_reason TEXT,
  
  -- Emission Test
  emission_url TEXT,
  emission_status TEXT DEFAULT 'pending',
  emission_uploaded_at TIMESTAMP,
  emission_approved_at TIMESTAMP,
  emission_rejected_at TIMESTAMP,
  emission_rejection_reason TEXT,
  
  -- Registration Certificate
  rc_url TEXT,
  rc_status TEXT DEFAULT 'pending',
  rc_uploaded_at TIMESTAMP,
  rc_approved_at TIMESTAMP,
  rc_rejected_at TIMESTAMP,
  rc_rejection_reason TEXT,
  
  -- Overall Status
  verification_status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(driver_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_verification_status ON driver_documents(verification_status);
```

## Step 2: Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `documents`
3. Set the bucket to **Public** (for public document URLs)
4. Add the following policy for authenticated users:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'documents'
  );

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');
```

## Step 3: Update Navigation

Add the screens to your navigation stack:

### For Driver Navigation:
```jsx
// In your driver navigation file (e.g., DriverNavigator.js)
import DriverDocumentUploadScreen from '../screens/driver/DriverDocumentUploadScreen';
import DriverVerificationStatusScreen from '../screens/driver/DriverVerificationStatusScreen';

// Inside your Stack.Navigator
<Stack.Screen 
  name="DriverDocumentUpload" 
  component={DriverDocumentUploadScreen}
  options={{
    title: 'Upload Documents',
    headerShown: true,
  }}
/>

<Stack.Screen 
  name="DriverVerificationStatus" 
  component={DriverVerificationStatusScreen}
  options={{
    title: 'Verification Status',
    headerShown: true,
  }}
/>
```

### For Super Admin Navigation:
```jsx
// In your super admin navigation file (e.g., SuperAdminNavigator.js)
import AdminVerificationDashboard from '../screens/superadmin/AdminVerificationDashboard';

// Inside your Stack.Navigator
<Stack.Screen 
  name="AdminVerificationDashboard" 
  component={AdminVerificationDashboard}
  options={{
    title: 'Document Verification',
    headerShown: true,
  }}
/>
```

## Step 4: Update User Status on Approval

When all documents are approved, update the user's status to allow login:

```javascript
// In AdminVerificationDashboard.js or your approval logic
const { error } = await supabase
  .from('users')
  .update({ status: 'active' })
  .eq('id', driverId);
```

## Step 5: Add to Registration Flow

Integrate the document upload screen into your driver registration flow:

```jsx
// After driver registration is complete
navigation.navigate('DriverDocumentUpload');
```

## Step 6: Add Status Check on Login

Check document verification status during driver login:

```javascript
// In your auth/login logic
const { data: docData } = await supabase
  .from('driver_documents')
  .select('verification_status')
  .eq('driver_id', userId)
  .single();

if (docData?.verification_status !== 'approved') {
  // Redirect to verification status screen
  navigation.navigate('DriverVerificationStatus');
}
```

## Usage Examples

### For Drivers - Upload Documents

```jsx
import DriverDocumentUploadScreen from '../screens/driver/DriverDocumentUploadScreen';

// Navigate to upload screen
navigation.navigate('DriverDocumentUpload');
```

### For Drivers - Check Status

```jsx
import DriverVerificationStatusScreen from '../screens/driver/DriverVerificationStatusScreen';

// Navigate to status screen
navigation.navigate('DriverVerificationStatus');
```

### For Admin - Verify Documents

```jsx
import AdminVerificationDashboard from '../screens/superadmin/AdminVerificationDashboard';

// Navigate to verification dashboard
navigation.navigate('AdminVerificationDashboard');
```

### Using Document Service

```javascript
import * as documentService from '../services/documentService';

// Pick an image
const imageData = await documentService.pickDocumentImage(true); // true for camera

// Upload document
const url = await documentService.uploadDocumentImage(driverId, 'DL', imageData);

// Update database
await documentService.updateDriverDocuments(driverId, {
  dl_url: url,
  dl_status: 'pending',
  dl_uploaded_at: new Date().toISOString(),
});

// Submit for verification
await documentService.submitDocumentsForVerification(driverId);

// Get pending verifications (admin)
const pending = await documentService.getPendingVerifications();

// Approve document (admin)
await documentService.approveDocument(driverId, 'DL');

// Reject document (admin)
await documentService.rejectDocument(driverId, 'DL', 'Document is blurry');
```

## Customization

### Change Required Documents

Edit the `REQUIRED_DOCUMENTS` array in each screen:

```javascript
const REQUIRED_DOCUMENTS = ['DL', 'VEHICLE_FRONT', 'INSURANCE', 'FC', 'EMISSION', 'RC'];
```

### Change Document Types

Edit the `DOCUMENT_TYPES` object:

```javascript
const DOCUMENT_TYPES = {
  DL: { label: 'Driver License', icon: 'card-outline' },
  VEHICLE_FRONT: { label: 'Vehicle Front', icon: 'car-outline' },
  // Add more as needed
};
```

### Change Colors

All components use `COLORS` from `constants.js`. Modify there to change the theme globally.

### Change Image Quality

In `documentService.js`, adjust the quality parameter:

```javascript
const options = {
  mediaTypes: ['images'],
  quality: 0.7, // Change this value (0-1)
  allowsEditing: false,
  base64: true,
};
```

## Permissions Required

The app needs the following permissions in `app.json`:

```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera."
      }
    ]
  ]
}
```

## Testing Checklist

- [ ] Database table created successfully
- [ ] Storage bucket created and configured
- [ ] Navigation screens added
- [ ] Driver can upload documents
- [ ] Admin can view pending verifications
- [ ] Admin can approve documents
- [ ] Admin can reject documents with reason
- [ ] User status updates to 'active' when all approved
- [ ] Driver can view verification status
- [ ] Document preview works
- [ ] Download functionality works
- [ ] Share functionality works
- [ ] Pull-to-refresh works
- [ ] Error handling works
- [ ] Loading states display correctly

## Troubleshooting

### Documents not uploading
- Check storage bucket permissions
- Verify user is authenticated
- Check network connectivity
- Review browser console for errors

### Admin dashboard not loading
- Verify user has super_admin role
- Check database query permissions
- Ensure driver_documents table exists

### Images not displaying
- Verify storage bucket is public
- Check image URLs are correct
- Ensure images were uploaded successfully

### Permission errors
- Check app.json permissions
- Request permissions at runtime
- Test on physical device (simulator may have issues)

## Performance Tips

1. **Compress images** before upload (already done at 70% quality)
2. **Use pagination** for admin dashboard if many pending verifications
3. **Cache document data** locally to reduce API calls
4. **Lazy load** document previews
5. **Optimize database queries** with proper indexes

## Security Considerations

1. **Validate file types** on client and server
2. **Limit file sizes** to prevent abuse
3. **Use HTTPS** for all API calls
4. **Implement rate limiting** on verification endpoints
5. **Log all admin actions** for audit trail
6. **Encrypt sensitive data** at rest

## Support

For issues or questions:
1. Check the DOCUMENT_VERIFICATION_README.md for detailed documentation
2. Review the component code comments
3. Check Supabase documentation
4. Review React Native documentation

## Next Steps

1. Implement email notifications when documents are approved/rejected
2. Add document expiry tracking
3. Implement automated document validation (OCR)
4. Add biometric verification
5. Implement document encryption
6. Add audit logging
