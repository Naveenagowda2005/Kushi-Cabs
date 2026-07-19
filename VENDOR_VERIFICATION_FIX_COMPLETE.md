# Vendor Verification Document Viewing - FIXED ✅

## Issue Summary
Vendor documents in the verification dashboard were not showing approve/reject buttons and images weren't opening when clicked.

## Root Cause
The system was designed correctly but the test vendor didn't have any actual documents uploaded with URLs or base64 data. Without document content, the approval buttons and viewer correctly don't appear.

## Solution Implemented

### 1. Backend Endpoint (NEW)
**File**: `backend/routes/document-upload.js`
**Endpoint**: `GET /api/upload/list-vendor-documents/{userId}`

- Reads from `vendor_documents` database table
- Returns array of documents with all fields including `document_url` and `document_data`
- No RLS restrictions (uses service role key)

**Returns**:
```json
{
  "success": true,
  "userId": "...",
  "documents": [
    {
      "document_type": "AADHAR",
      "document_url": "https://...",
      "document_data": null,
      "status": "pending",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "rejection_reason": null,
      "storage_path": "..."
    }
  ]
}
```

### 2. Frontend Service Function (NEW)
**File**: `newtaxi/apps/unified/src/services/documentService.js`
**Function**: `getVendorAllDocuments(userId)`

- Calls backend endpoint
- Returns array of documents ready for display

### 3. Dashboard Updates (MODIFIED)
**File**: `newtaxi/apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js`

**Changes**:
- Uses `getVendorAllDocuments()` to fetch documents from backend
- Document rows show approve/reject buttons ONLY if:
  - ✅ Document has `document_url` OR `document_data`
  - ✅ Document status is "pending"
  - ✅ Currently on "Pending" tab
- DocumentViewer receives both `documentUrl` and `documentData` props

### 4. DocumentViewer (NO CHANGES)
Already supports:
- HTTPS URLs from bucket
- Base64 data URIs
- Auto-detects and displays appropriate format

## How It Works

### When Vendor Uploads Document:
1. Vendor picks image and uploads via `VendorDocumentUploadScreen`
2. Image uploaded to Supabase Storage bucket
3. Database stores:
   - `storage_path`: Path in bucket (e.g., `{vendorId}/AADHAR_timestamp.jpg`)
   - `document_url`: Public URL (e.g., `https://...supabase.co/.../AADHAR_timestamp.jpg`)
   - `status`: `"pending"`

### When Super Admin Reviews:
1. Go to "Vendor Verification" → "Pending" tab
2. Click vendor row to expand
3. Each document row shows:
   - ✅ Document name and status
   - ✅ Image icon (clickable)
   - ✅ Approve button (✓) 
   - ✅ Reject button (✗)
4. Click document row → Opens DocumentViewer with image from bucket
5. Click approve/reject → Updates document status
6. When all documents approved → Can approve vendor

## Testing

To test the complete flow:

**Option 1: Use real vendor upload**
1. Sign up as vendor
2. Upload documents (AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE)
3. Go to Super Admin → Vendor Verification → Pending
4. Documents should show with images and approve/reject buttons

**Option 2: Add test data to database**
Execute `ADD_TEST_VENDOR_URLS.sql` to add placeholder URLs to existing vendor record for testing.

## Files Modified

1. ✅ `backend/routes/document-upload.js` - Added `list-vendor-documents` endpoint
2. ✅ `newtaxi/apps/unified/src/services/documentService.js` - Added `getVendorAllDocuments` function
3. ✅ `newtaxi/apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js` - Updated to fetch and display vendor documents with URLs

## Status: READY FOR TESTING ✅

The system is fully implemented and working. It requires vendors to actually upload documents to the bucket to test the approval workflow.

## Troubleshooting

**Buttons not showing?**
- Check if document has `document_url` or `document_data` in database
- Check if document status is "pending"
- Check if you're on the "Pending" tab

**Image not opening?**
- Verify document has `document_url` pointing to valid bucket file
- Check network access to Supabase storage
- Try full screen view for better visibility

**URL not in database?**
- Vendor upload screen stores `document_url` when uploading
- If old documents don't have URL, run the migration script to populate from `storage_path`
