# Driver Document Verification System

This document describes the React Native components and screens for the driver document verification system.

## Components

### 1. DocumentUploadCard.js
Reusable component for displaying and managing individual document uploads.

**Props:**
- `documentType` (string): Type of document (DL, VEHICLE_FRONT, INSURANCE, FC, EMISSION, RC)
- `status` (string): Document status - 'pending', 'approved', or 'rejected'
- `rejectionReason` (string): Reason for rejection if status is 'rejected'
- `onUpload` (function): Callback when upload is triggered - `(documentType, useCamera) => void`
- `isUploading` (boolean): Whether upload is in progress

**Features:**
- Displays document type with icon
- Shows status badge with color coding
- Displays rejection reason if applicable
- Upload/Re-upload button with camera/gallery options
- Responsive design with proper spacing

**Example Usage:**
```jsx
<DocumentUploadCard
  documentType="DL"
  status="pending"
  onUpload={handleUploadDocument}
  isUploading={uploading['DL']}
/>
```

### 2. DocumentViewer.js
Component for viewing and managing document previews.

**Props:**
- `visible` (boolean): Whether modal is visible
- `documentUrl` (string): URL of the document to view
- `documentType` (string): Type of document being viewed
- `onClose` (function): Callback when modal is closed

**Features:**
- Modal and full-screen view modes
- Image preview with zoom support
- PDF document handling (with download option)
- Download functionality
- Share functionality
- Responsive image scaling

**Example Usage:**
```jsx
<DocumentViewer
  visible={viewerVisible}
  documentUrl={selectedDocument.url}
  documentType={selectedDocument.type}
  onClose={() => setViewerVisible(false)}
/>
```

## Screens

### 1. DriverDocumentUploadScreen.js
Main screen for drivers to upload required documents during registration.

**Location:** `src/screens/driver/DriverDocumentUploadScreen.js`

**Features:**
- Display all 6 required documents
- Upload status for each document
- Overall verification status with progress bar
- Submit button to send documents for verification
- Rejection reason display
- Document preview on tap
- Pull-to-refresh functionality
- Loading states

**Required Documents:**
- DL (Driver License)
- VEHICLE_FRONT (Vehicle Front)
- INSURANCE (Insurance)
- FC (Fitness Certificate)
- EMISSION (Emission Test)
- RC (Registration)

**Database Table:** `driver_documents`

**Example Navigation:**
```jsx
navigation.navigate('DriverDocumentUpload')
```

### 2. DriverVerificationStatusScreen.js
Screen showing the current verification status of driver documents.

**Location:** `src/screens/driver/DriverVerificationStatusScreen.js`

**Features:**
- Overall verification status display
- Progress bar showing approved documents
- Individual document status list
- Timeline view with timestamps
- Re-upload button if documents are rejected
- Document preview on tap
- Pull-to-refresh functionality

**Status Types:**
- Pending: Awaiting admin review
- Approved: Document verified
- Rejected: Document needs re-upload

**Example Navigation:**
```jsx
navigation.navigate('DriverVerificationStatus')
```

### 3. AdminVerificationDashboard.js
Super admin screen for verifying driver documents.

**Location:** `src/screens/superadmin/AdminVerificationDashboard.js`

**Features:**
- List of pending verifications
- Driver information display
- Document grid view
- Approve/Reject buttons
- Rejection reason modal
- Document preview
- Real-time status updates
- Pull-to-refresh functionality

**Admin Actions:**
- Approve individual documents
- Reject documents with reason
- View document details
- Track verification timeline

**Example Navigation:**
```jsx
navigation.navigate('AdminVerificationDashboard')
```

## Service

### documentService.js
Utility service for document operations.

**Location:** `src/services/documentService.js`

**Functions:**

#### `pickDocumentImage(useCamera)`
Pick an image from camera or gallery.
```javascript
const imageData = await pickDocumentImage(true); // true for camera
// Returns: { uri: string, base64: string }
```

#### `uploadDocumentImage(driverId, documentType, imageData)`
Upload document image to Supabase Storage.
```javascript
const url = await uploadDocumentImage(driverId, 'DL', imageData);
// Returns: public URL of uploaded document
```

#### `getDriverDocuments(driverId)`
Get driver's document records.
```javascript
const docs = await getDriverDocuments(driverId);
```

#### `updateDriverDocuments(driverId, documentData)`
Create or update driver documents.
```javascript
const updated = await updateDriverDocuments(driverId, {
  dl_url: 'https://...',
  dl_status: 'pending',
  dl_uploaded_at: new Date().toISOString()
});
```

#### `submitDocumentsForVerification(driverId)`
Submit documents for admin verification.
```javascript
await submitDocumentsForVerification(driverId);
```

#### `getPendingVerifications()`
Get all pending verifications (admin only).
```javascript
const pending = await getPendingVerifications();
```

#### `approveDocument(driverId, documentType)`
Approve a document (admin only).
```javascript
await approveDocument(driverId, 'DL');
```

#### `rejectDocument(driverId, documentType, rejectionReason)`
Reject a document with reason (admin only).
```javascript
await rejectDocument(driverId, 'DL', 'Document is blurry');
```

#### `areAllDocumentsApproved(documentRecord)`
Check if all documents are approved.
```javascript
const allApproved = areAllDocumentsApproved(docRecord);
```

#### `getDocumentSummary(documentRecord)`
Get document verification summary.
```javascript
const summary = getDocumentSummary(docRecord);
// Returns: { total, approved, rejected, pending, isComplete, hasRejections }
```

## Database Schema

### driver_documents Table

```sql
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id),
  
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
  verification_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMP,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(driver_id)
);

CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_verification_status ON driver_documents(verification_status);
```

## Storage Configuration

Documents are stored in Supabase Storage under the `documents` bucket with the following structure:

```
documents/
├── {driver_id}/
│   ├── DL_{timestamp}.jpg
│   ├── VEHICLE_FRONT_{timestamp}.jpg
│   ├── INSURANCE_{timestamp}.jpg
│   ├── FC_{timestamp}.jpg
│   ├── EMISSION_{timestamp}.jpg
│   └── RC_{timestamp}.jpg
```

## Styling

All components use the COLORS constant from `src/constants.js`:

- **Primary Color:** `#9333ea` (Purple)
- **Success Color:** `#22c55e` (Green)
- **Error Color:** `#ef4444` (Red)
- **Warning Color:** `#f97316` (Orange)
- **Background:** `#0f0a1e` (Dark)
- **Surface:** `#1a1530` (Slightly lighter dark)
- **Text:** `#ffffff` (White)

## Integration Steps

1. **Add to Navigation:**
   ```jsx
   // In driver navigation
   <Stack.Screen 
     name="DriverDocumentUpload" 
     component={DriverDocumentUploadScreen} 
   />
   <Stack.Screen 
     name="DriverVerificationStatus" 
     component={DriverVerificationStatusScreen} 
   />
   
   // In super admin navigation
   <Stack.Screen 
     name="AdminVerificationDashboard" 
     component={AdminVerificationDashboard} 
   />
   ```

2. **Create Database Table:**
   Run the SQL schema provided above in Supabase.

3. **Set Up Storage Bucket:**
   Create a `documents` bucket in Supabase Storage with public access.

4. **Update User Status:**
   When all documents are approved, update user status to 'active' to allow login.

## Error Handling

All components include proper error handling:
- Permission requests for camera/gallery
- Network error handling
- File upload validation
- User-friendly error messages
- Loading states during operations

## Performance Considerations

- Images are compressed to 70% quality before upload
- Base64 encoding is used for reliable cross-platform uploads
- Pull-to-refresh for manual data updates
- Efficient database queries with proper indexing
- Lazy loading of document previews

## Security

- Documents are stored in Supabase Storage with proper access controls
- Only drivers can upload their own documents
- Only super admins can approve/reject documents
- Rejection reasons are logged for audit trail
- Timestamps track all document operations

## Future Enhancements

- Batch document upload
- Document expiry tracking
- Automated email notifications
- Document OCR validation
- Biometric verification
- Document encryption
- Audit logging
