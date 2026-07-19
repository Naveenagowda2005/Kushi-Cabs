# Task 7: Fix Vendor Verification Document Viewing & Approval

## Status: COMPLETE ✅

## Problem
Vendor documents in the verification dashboard:
1. Click on document row did not open image viewer
2. Approve/Reject buttons (checkmark/X icons) did not show
3. Root cause: No way to fetch vendor documents for the dashboard

## Solution Implemented

### Key Change: Vendors Use Database Table Only (Not Bucket)

Unlike drivers who store files in the bucket, vendor documents are stored in the `vendor_documents` database table with the document structure:
```json
{
  "AADHAR": {
    "status": "pending",
    "document_data": "base64_encoded_image...",
    "document_url": null,
    "uploaded_at": "2024-01-15T10:30:00Z"
  },
  "PAN_CARD": { ... },
  ...
}
```

### 1. Backend Changes
**File**: `backend/routes/document-upload.js`

Added new endpoint: `GET /api/upload/list-vendor-documents/:userId`

**What it does**:
- Queries `vendor_documents` table for the user
- Extracts the `documents` JSON column (contains all vendor documents)
- Transforms into array format with document_type, status, document_data/document_url
- Returns NO errors even if no record found (empty array)

**Returns**:
```json
{
  "success": true,
  "userId": "16a0a599-405b-4dc6-838c-3e4ddf7de384",
  "documents": [
    {
      "document_type": "AADHAR",
      "status": "pending",
      "document_data": "base64_encoded_image...",
      "document_url": null,
      "uploaded_at": "2024-01-15T10:30:00Z",
      "rejection_reason": null
    },
    ...
  ],
  "count": 4
}
```

### 2. Frontend Service Function
**File**: `newtaxi/apps/unified/src/services/documentService.js`

Added/Updated function: `getVendorAllDocuments(userId)`

**What it does**:
- Calls backend endpoint
- Returns array of vendor documents with status and data (base64 or URL)

### 3. Frontend Dashboard Update
**File**: `newtaxi/apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js`

**Changes**:
1. Updated import to include `getVendorAllDocuments`
2. Modified `loadVendorVerifications` to use backend endpoint instead of RPC
3. Updated document click handler to support both URLs and base64:
   ```javascript
   if (doc?.document_url || doc?.document_data) {
     setSelectedDocument({
       url: doc.document_url || null,
       data: doc.document_data || null,
       type: docType,
     });
     setViewerVisible(true);
   }
   ```
4. Updated approve/reject button visibility to check for data OR URL:
   ```javascript
   {tabIndex === 0 && (doc?.document_url || doc?.document_data) && ...}
   ```
5. Updated DocumentViewer call to pass both URL and data

### 4. DocumentViewer (Already Supports Both)
**File**: `newtaxi/apps/unified/src/components/DocumentViewer.js`

Already has smart handling:
```javascript
const imageUri = documentUrl 
  ? documentUrl 
  : (documentData ? base64ToDataUri(documentData) : null);
```
Uses URL if available, otherwise converts base64 to data URI

## Results

✅ **Vendor documents display correctly** from database table
✅ **Documents can be viewed** - DocumentViewer displays base64 images
✅ **Approval/Reject buttons show** for pending documents with data
✅ **Admin can approve/reject** documents
✅ **Status displays correctly** - pending/approved/rejected
✅ **System ready for vendors uploading documents**

## How It Works

1. Super Admin opens Vendor Verification screen
2. Dashboard calls `getVendorAllDocuments(vendorUserId)`
3. Backend queries `vendor_documents` table
4. Returns documents with base64 image data
5. Admin clicks document row → DocumentViewer opens
6. DocumentViewer converts base64 to data URI and displays image
7. Admin clicks ✓ to approve or ✗ to reject
8. Document status updated in database
9. When all documents approved, vendor can be approved

## Files Modified

1. `backend/routes/document-upload.js` - Added list-vendor-documents endpoint (reads from vendor_documents table)
2. `newtaxi/apps/unified/src/services/documentService.js` - Updated getVendorAllDocuments function
3. `newtaxi/apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js` - Updated to use backend endpoint, support base64 data

## Important: Database-Only Architecture for Vendors

Vendor documents:
- ✅ Stored in `vendor_documents` table (JSON column `documents`)
- ✅ Include base64 image data OR URLs
- ✅ Admin views directly from database (no bucket fetch needed)
- ✅ Simple and efficient

Driver documents:
- ✅ Stored in Supabase Storage bucket
- ✅ Database tracks metadata and status
- ✅ Backend fetches files from bucket and creates URLs
- ✅ Different architecture for different use cases
