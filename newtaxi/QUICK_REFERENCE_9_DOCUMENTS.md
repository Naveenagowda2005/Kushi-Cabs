# Quick Reference: 9 Required Documents System

## What Changed?
Driver verification now requires **9 documents** instead of 6.

---

## The 9 Required Documents

### **Original 6 Documents:**
1. **DL** - Driver's License
2. **VEHICLE_FRONT** - Vehicle Front Photo
3. **INSURANCE** - Insurance Certificate
4. **FC** - Fitness Certificate
5. **EMISSION** - Emission Test Certificate
6. **RC** - Registration Certificate

### **New 3 Documents:**
7. **AADHAR** - Aadhar ID
8. **BANK_PASSBOOK_FRONT** - Bank Passbook Front Photo
9. **DRIVER_SELFIE** - Driver Selfie *(Camera Capture Only)*

---

## Key Features

### Document 1-8 (Traditional Upload):
- Driver can choose **Camera** or **Gallery**
- Takes photo or selects from device
- Stored as base64 in database

### Document 9 (Driver Selfie):
- **Automatic camera launch** - no menu selection
- Driver takes selfie directly
- Stored as base64 in database
- Special icon (person-circle)

---

## Driver Experience Flow

```
1. Driver registers → 
2. Navigates to "Upload Documents" screen →
3. Sees all 9 document cards:
   - 8 cards with "Upload" button (camera/gallery choice)
   - 1 card (DRIVER_SELFIE) with "Capture Selfie" button
4. For each of 8 docs: selects camera/gallery →
5. For DRIVER_SELFIE: clicks button → camera opens directly →
6. Once all 9 uploaded: "Submit for Verification" button enables →
7. Submits all 9 documents →
8. Sees "Waiting for Approval" screen →
9. Super admin reviews all 9 documents →
10. Super admin approves all 9 → Driver can login to dashboard
```

---

## Database Changes

**Migration**: `supabase/migrations/043_add_new_document_types.sql`

**What's new in database**:
- Enum `driver_document_type` includes 9 values
- Triggers require all 9 documents for verification
- Storage: Still in `driver_documents` table as base64 in `document_data` column
- Status values: `uploaded`, `pending_review`, `approved`, `rejected`

---

## Code Files Updated

### 1. Service Layer
**File**: `src/services/documentService.js`
- ✅ `getDocumentLabel()` - Returns display name for each of 9 docs
- ✅ `getDocumentIcon()` - Returns icon name for each of 9 docs
- ✅ `areAllDocumentsApproved()` - Checks all 9 are approved
- ✅ `getDocumentSummary()` - Shows progress toward 9 documents

### 2. Upload Screen
**File**: `src/screens/driver/DriverDocumentUploadScreen.js`
- ✅ `REQUIRED_DOCUMENTS` array has 9 values
- ✅ Progress bar shows `X/9` progress
- ✅ Submit button enables when all 9 uploaded

### 3. Document Card Component
**File**: `src/components/DocumentUploadCard.js`
- ✅ DRIVER_SELFIE has automatic camera logic
- ✅ Other 8 documents show camera/gallery menu
- ✅ Correct icons and labels for all 9

---

## Testing the New System

### Before Migration:
- [ ] Run app - should still see 6 documents (migration not applied)

### After Migration Applied in Supabase:
- [ ] Run app - should now show 9 documents
- [ ] Try uploading documents:
  - [ ] Select documents 1-8 with camera/gallery
  - [ ] For document 9: camera should launch automatically
- [ ] Upload all 9 - submit button should enable
- [ ] Submit all 9 - navigate to WaitingForApprovalScreen
- [ ] Super admin: verify all 9 documents visible
- [ ] Super admin: approve/reject each document
- [ ] Driver: once approved, can login to dashboard

---

## Status Summary

### ✅ Completed (Code changes):
- Document service layer updated
- UI screens updated for 9 documents
- DocumentUploadCard enhanced with camera-only for selfie
- Icons and labels configured for all 9
- Progress tracking updated

### ⏳ Pending (Database migration):
- **IMPORTANT**: Run migration 043 in Supabase
- See `MIGRATION_043_INSTRUCTIONS.md` for details

### 📦 Deployment:
- Once migration applied, deploy new code to production
- New driver signups will require all 9 documents
- Existing drivers can continue with partial uploads

---

## Troubleshooting

### Camera Not Opening for Selfie
- Check permission status: `ImagePicker.requestCameraPermissionsAsync()`
- May need Android/iOS permission in app.json

### All 9 Documents Not Showing
- Ensure migration 043 has been applied in Supabase
- Check that app has been rebuilt/refreshed

### Submit Button Still Disabled
- Verify all 9 documents have `document_data` (uploaded)
- Check browser console for errors

---

## Icon Reference

| Document | Icon | Display |
|----------|------|---------|
| DL | card-outline | Card-like icon |
| VEHICLE_FRONT | car-outline | Car icon |
| INSURANCE | document-outline | Document icon |
| FC | checkmark-circle-outline | Checkmark icon |
| EMISSION | leaf-outline | Leaf icon |
| RC | document-text-outline | Document with text |
| AADHAR | id-card-outline | ID card icon |
| BANK_PASSBOOK | document-text-outline | Document with text |
| DRIVER_SELFIE | person-circle-outline | Person icon |

---

## Label Reference

| Document Code | Display Label |
|---------------|---------------|
| DL | Driver License |
| VEHICLE_FRONT | Vehicle Front Photo |
| INSURANCE | Insurance Certificate |
| FC | Fitness Certificate |
| EMISSION | Emission Test Certificate |
| RC | Registration Certificate |
| AADHAR | Aadhar ID |
| BANK_PASSBOOK_FRONT | Bank Passbook Front |
| DRIVER_SELFIE | Driver Selfie |

---

## Database Enum Values

All 9 values in `driver_document_type` enum:
- `DL`
- `VEHICLE_FRONT`
- `INSURANCE`
- `FC`
- `EMISSION`
- `RC`
- `AADHAR`
- `BANK_PASSBOOK_FRONT`
- `DRIVER_SELFIE`

---

**Ready to Test!** Just apply the migration and you're good to go.
