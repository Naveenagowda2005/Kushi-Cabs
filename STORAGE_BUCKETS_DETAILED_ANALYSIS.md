# Storage Buckets - Detailed Analysis

## Driver Documents (driver-documents bucket)

**Total Required: 6 document types**

From migration `037_driver_documents_verification.sql`:

```
driver_document_type ENUM:
1. DL              - Driver's License
2. VEHICLE_FRONT   - Vehicle Front Photo
3. INSURANCE       - Insurance Certificate
4. FC              - Fitness Certificate
5. EMISSION        - Emission Certificate
6. RC              - Registration Certificate
```

**From migration 043 (new additions):**
```
7. AADHAR                -- Aadhar ID (New)
8. BANK_PASSBOOK_FRONT   -- Bank Passbook Front Photo (New)
9. DRIVER_SELFIE         -- Driver Selfie (New)
```

**Total: 9 document types for drivers**

---

## Vendor Documents (vendor-documents bucket) 

**From migration `051_vendor_documents_verification.sql`:**

```
vendor_document_type ENUM:
1. AADHAR                  -- Aadhar Card
2. PAN_CARD                -- PAN Card
3. BANK_PASSBOOK_FRONT     -- Bank Passbook Front Page
4. VENDOR_SELFIE           -- Vendor Selfie (implied from schema)
```

**Storage method: JSONB** 
- All vendor documents stored in single JSONB field
- Structure: `{ "AADHAR": {...}, "PAN_CARD": {...}, etc }`

---

## Summary Table

| Bucket | Document Type | Count | Storage Table |
|--------|---------------|-------|----------------|
| driver-documents | DL, RC, INSURANCE, FC, EMISSION, AADHAR, BANK_PASSBOOK_FRONT, DRIVER_SELFIE | 8 | `driver_documents` table |
| user-avatars | Profile photos | N/A | `users.avatar_base64` column |
| vendor-documents | AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE | 4 | `vendor_documents.documents` (JSONB) |
| trip-photos | Odometer, Start, End, Location photos | N/A | Need to add to `trips` table |
| vehicle-photos | Vehicle Front, Back, Side, Interior | N/A | Need to add to `vehicles` table |

---

## Current Storage Method

### Driver Documents
- **Table:** `driver_documents`
- **Column:** `document_data` (TEXT - base64 encoded)
- **Size per document:** ~2-5 MB
- **Records:** ~9 types per driver

### Vendor Documents
- **Table:** `vendor_documents`
- **Column:** `documents` (JSONB)
- **Structure:** Each document stored as object in JSONB
- **Size:** ~2-5 MB per document type

### User Avatars
- **Table:** `users`
- **Column:** `avatar_base64` (TEXT)
- **Size:** ~1-2 MB per user

---

## Recommendation

### Bucket Strategy:

**Option 1: Separate buckets (Current plan)**
- `driver-documents` - All driver docs (DL, RC, Insurance, FC, Emission, Aadhar, Bank, Selfie)
- `vendor-documents` - All vendor docs (Aadhar, PAN, Bank, Selfie)
- `user-avatars` - User profile photos
- `trip-photos` - Trip images
- `vehicle-photos` - Vehicle images

**Total: 5 buckets** ✅

**Option 2: Combined bucket**
- `documents` - Everything (driver docs + vendor docs)
- `avatars` - All profile photos
- `media` - Trip and vehicle photos

**Total: 3 buckets**

---

## Action Items

Choose Option 1 or Option 2, then:

1. Create chosen buckets in Supabase
2. Update migration 101 with correct bucket names
3. Update storageService.js with new bucket constants
4. Migrate data from tables to buckets
5. Update code to read from storage

**I recommend Option 1 (5 buckets)** for better organization and granular RLS policies.

Which option do you prefer?
