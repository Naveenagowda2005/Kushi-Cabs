# Fix: "Document Not Found in Storage" Error

## Problem
When super admin clicks on a document in the Driver Verification screen to view it, error shows:
```
"Document not found in storage"
```

## Root Cause
The AdminVendorVerificationDashboard was passing the wrong props to DocumentViewer:

**Was passing:**
```javascript
<DocumentViewer
  visible={viewerVisible}
  documentData={selectedDocument?.data}    // ← WRONG!
  documentType={selectedDocument?.type}
/>
```

**Should be:**
```javascript
<DocumentViewer
  visible={viewerVisible}
  documentUrl={selectedDocument?.url}      // ← CORRECT!
  documentType={selectedDocument?.type}
/>
```

**Why:** 
- When clicking on driver document, code sets `selectedDocument = { url: doc.document_url, type: docType }`
- But then passes `documentData` prop (which looks for `.data` field that doesn't exist)
- DocumentViewer expects `documentUrl` to load from bucket
- With wrong prop, DocumentViewer tries to load undefined/null URL → "document not found"

## Fix Applied
**File:** `apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js`

**Line 1001-1004:** Changed from `documentData` to `documentUrl`

```javascript
// BEFORE
<DocumentViewer
  visible={viewerVisible}
  documentData={selectedDocument?.data}
  documentType={selectedDocument?.type}
  onClose={() => setViewerVisible(false)}
/>

// AFTER
<DocumentViewer
  visible={viewerVisible}
  documentUrl={selectedDocument?.url}
  documentType={selectedDocument?.type}
  onClose={() => setViewerVisible(false)}
/>
```

## What This Fixes
✅ Super admin can now click on driver documents to view them
✅ Images load from storage bucket
✅ "Document not found" error goes away
✅ Full-screen view and zoom controls work

## Testing
1. Restart super admin app
2. Go to Driver Verification tab
3. Click on a driver card to expand
4. Click on any document (e.g., DL, VEHICLE_FRONT)
5. Document viewer opens with image
6. Can zoom, expand to full screen
7. No "not found" error

## Related Components
- **DocumentViewer** accepts both `documentData` (base64) and `documentUrl` (storage URL)
- For driver documents in bucket: uses `documentUrl`
- For vendor documents stored in DB: uses `documentData`
- This fix ensures driver documents use the correct prop

## Code Context
The flow is:
1. Super admin clicks document
2. `setSelectedDocument({ url: doc.document_url, type: docType })` sets the URL
3. `setViewerVisible(true)` opens modal
4. DocumentViewer receives `documentUrl={selectedDocument?.url}`
5. Image loads from bucket URL
6. User can view/zoom/expand
