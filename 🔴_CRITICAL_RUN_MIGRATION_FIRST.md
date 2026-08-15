# 🔴 CRITICAL: Run Migration First!

## Why Vendor Signup Isn't Working

**Problem:** Vendors are bypassing document upload and going straight to dashboard.

**Root Cause:** The database migration hasn't been executed, so the vendor verification tables don't exist.

## ✅ Solution (2 Minutes)

### Step 1: Open Supabase
Go to: https://app.supabase.com → Your Project

### Step 2: SQL Editor
Click: **SQL Editor** (left sidebar) → **New Query**

### Step 3: Copy & Run
Copy everything from this file:
```
RUN_THIS_MIGRATION.sql
```

Or copy this SQL directly:

```sql
CREATE TYPE vendor_document_type AS ENUM ('AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE');

CREATE TABLE vendor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  documents JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_verification_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_status TEXT DEFAULT 'not_started' CHECK (overall_status IN ('not_started', 'pending', 'approved', 'rejected')),
  all_documents_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_user_id ON vendor_documents(user_id);
CREATE INDEX idx_vendor_verification_status_vendor_id ON vendor_verification_status(vendor_id);
CREATE INDEX idx_vendor_verification_status_user_id ON vendor_verification_status(user_id);
CREATE INDEX idx_vendor_verification_status_overall_status ON vendor_verification_status(overall_status);

CREATE OR REPLACE FUNCTION sync_vendor_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET verification_status = CASE 
    WHEN NEW.overall_status = 'approved' THEN 'approved'
    WHEN NEW.overall_status = 'rejected' THEN 'rejected'
    WHEN NEW.all_documents_submitted THEN 'pending'
    ELSE 'not_started'
  END
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_vendor_verification_status
  AFTER INSERT OR UPDATE ON vendor_verification_status
  FOR EACH ROW EXECUTE FUNCTION sync_vendor_verification_status();

COMMENT ON TABLE vendor_documents IS 'Stores vendor verification documents (Aadhar, PAN, Bank Passbook, Selfie)';
COMMENT ON TABLE vendor_verification_status IS 'Tracks overall vendor verification and approval status';
COMMENT ON COLUMN vendor_verification_status.overall_status IS 'Vendor verification status: not_started, pending, approved, rejected';
```

### Step 4: Execute
Paste into SQL Editor → Click **Run** → Wait for success message

### Step 5: Verify
Go to **Table Editor** (left sidebar) and verify:
- ✅ `vendor_documents` table appears
- ✅ `vendor_verification_status` table appears

### Step 6: Reload App
- Close app
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Test vendor signup again

## 🎯 Expected Behavior After Migration

### New Vendor Signup Flow:
1. Vendor enters phone number
2. Verifies OTP
3. Enters name & business name
4. **→ REDIRECTED TO DOCUMENT UPLOAD SCREEN** ✅ (This is what was missing!)
5. Uploads 4 documents:
   - Aadhar Card
   - PAN Card
   - Bank Passbook
   - Selfie
6. Submits for verification
7. Sees "Waiting for Approval" screen
8. Waits for admin approval (5-second polling)

## 🔍 What Tables Were Missing

Without running the migration, these tables didn't exist:
- `vendor_documents` - stores the 4 required documents
- `vendor_verification_status` - tracks approval status

When tables don't exist, the app defaults to allowing dashboard access.

## ✅ This Will Fix:

✅ Vendor document upload screen will show
✅ Real-time status polling will work
✅ Admin can verify and approve vendors
✅ Rejection reasons will display
✅ Everything works like driver verification

## ⏱️ Time to Complete
- Migration: 1 minute
- Testing: 2-3 minutes
- **Total: 5 minutes**

---

**DO THIS NOW BEFORE TESTING VENDOR SIGNUP AGAIN!**

Once migration is done, new vendors will properly go through the document upload process. 🚀
