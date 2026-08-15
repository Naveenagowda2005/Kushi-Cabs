# 🚨 URGENT: Apply Vendor Verification Migration

## Error You're Seeing

```
ERROR: Could not find the table 'public.vendor_verification_status'
```

This means the database migration hasn't been run yet.

## ✅ How to Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Login to your project
3. Click: **SQL Editor** (left sidebar)
4. Click: **New Query**

### Step 2: Copy & Paste the SQL

Copy the entire content from this file:
```
newtaxi/supabase/migrations/051_vendor_documents_verification.sql
```

Or use the SQL below:

```sql
-- ============================================================
-- VENDOR DOCUMENT VERIFICATION SYSTEM
-- Migration: 051_vendor_documents_verification.sql
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

-- Vendor document types enum
CREATE TYPE vendor_document_type AS ENUM (
  'AADHAR',                -- Aadhar Card
  'PAN_CARD',              -- PAN Card
  'BANK_PASSBOOK_FRONT',   -- Bank Passbook Front Page
  'VENDOR_SELFIE'          -- Vendor Selfie
);

-- ============================================================
-- VENDOR_DOCUMENTS TABLE
-- ============================================================
CREATE TABLE vendor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  documents JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VENDOR_VERIFICATION_STATUS TABLE
-- ============================================================
CREATE TABLE vendor_verification_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_status TEXT DEFAULT 'not_started' 
    CHECK (overall_status IN ('not_started', 'pending', 'approved', 'rejected')),
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

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_user_id ON vendor_documents(user_id);
CREATE INDEX idx_vendor_verification_status_vendor_id ON vendor_verification_status(vendor_id);
CREATE INDEX idx_vendor_verification_status_user_id ON vendor_verification_status(user_id);
CREATE INDEX idx_vendor_verification_status_overall_status ON vendor_verification_status(overall_status);

-- ============================================================
-- TRIGGER
-- ============================================================
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

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE vendor_documents IS 'Stores vendor verification documents (Aadhar, PAN, Bank Passbook, Selfie)';
COMMENT ON TABLE vendor_verification_status IS 'Tracks overall vendor verification and approval status';
COMMENT ON COLUMN vendor_verification_status.overall_status IS 'Vendor verification status: not_started, pending, approved, rejected';
```

### Step 3: Execute the Query
1. Paste the SQL into the editor
2. Click: **Run** button (or Ctrl+Enter)
3. Wait for it to complete
4. ✅ You should see: "Success. No rows returned." (or similar)

### Step 4: Verify Tables Created
1. Click: **Table Editor** (left sidebar)
2. Look for:
   - ✅ `vendor_documents` (should appear in table list)
   - ✅ `vendor_verification_status` (should appear in table list)
3. If both appear → Migration successful!

### Step 5: Reload App
1. Close the app
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Test vendor signup again
4. Should work now! ✨

---

## What This Migration Does

✅ Creates `vendor_documents` table
✅ Creates `vendor_verification_status` table
✅ Creates `vendor_document_type` enum
✅ Creates indexes for performance
✅ Creates trigger for syncing status

---

## If You Get an Error

### Error: "relation 'vendors' does not exist"
- **Fix:** Make sure `vendors` table exists (it should from earlier migrations)

### Error: "type 'vendor_document_type' already exists"
- **Fix:** This type was already created, that's fine - migration still works

### Error: "table 'vendor_documents' already exists"
- **Fix:** Migration already ran - tables are there, you're good!

### Any Other Error
- Copy the error message
- Check Supabase documentation
- Or reach out for help

---

## ✅ After Migration Complete

The vendor verification system will now work:
- ✅ Vendors can upload documents
- ✅ Real-time status polling works
- ✅ Admin can approve/reject
- ✅ No more errors!

---

## 🎯 Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied migration SQL
- [ ] Executed the query
- [ ] Got success message
- [ ] Verified tables created
- [ ] Reloaded app
- [ ] Tested vendor signup
- [ ] ✅ All working!

---

## 📞 Need Help?

1. Check browser console for errors (F12)
2. Check Supabase logs
3. Verify all prerequisites met:
   - vendors table exists
   - users table exists
   - Authentication works
4. Try the migration again

---

**IMPORTANT:** Run this migration before testing vendor signup!

This is a one-time setup. After running once, no need to run again.

Good luck! 🚀
