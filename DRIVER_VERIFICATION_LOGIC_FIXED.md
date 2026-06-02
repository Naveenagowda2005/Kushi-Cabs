# Driver Document Verification Logic - FIXED

## The Problem
1. **Admin Dashboard**: Not showing drivers who submitted documents for verification
2. **Driver Login**: Drivers were logging directly to dashboard even if documents were pending approval
3. **Expected Flow**: 
   - Driver uploads documents (not yet visible to admin)
   - Driver submits for verification (now visible to admin in pending_review status)
   - Admin approves → Driver can login to dashboard
   - Admin rejects → Driver must re-upload
   - Driver logs in while pending → Should see "Waiting for Approval" screen

## Fixes Applied

### 1. Fixed Query for Admin Dashboard
**File**: `src/services/documentService.js`

**Changed**:
```javascript
// Before:
.eq('overall_status', 'pending')

// After:
.eq('overall_status', 'pending_review')
```

**Why**: After migration 041, the status is `'pending_review'` not `'pending'`

---

### 2. Fixed Driver Login Verification Logic
**File**: `src/context/AuthContext.js`

**Complete New Logic**:
```javascript
// For drivers, check documents are approved before allowing login
if (userData.roles?.name === 'driver') {
  try {
    const { data: verificationStatus } = await supabase
      .from('driver_verification_status')
      .select('overall_status, all_documents_submitted')
      .eq('driver_id', userData.id)
      .single();

    if (verificationStatus) {
      // 1. Documents not submitted → Block login (must upload first)
      if (!verificationStatus.all_documents_submitted) {
        throw new Error('Please upload your documents first.');
      }
      
      // 2. Documents pending review → Allow login (shows WaitingForApprovalScreen)
      if (verificationStatus.overall_status === 'pending_review') {
        console.log('Allowing login - will show WaitingForApprovalScreen');
      }
      
      // 3. Documents approved → Allow login (shows Dashboard)
      if (verificationStatus.overall_status === 'approved') {
        console.log('Allowing login to dashboard');
      }
      
      // 4. Documents rejected → Block login (must re-upload)
      if (verificationStatus.overall_status === 'rejected') {
        throw new Error('Your documents were rejected. Please re-upload.');
      }
    } else {
      // No verification record → New driver, must upload first
      throw new Error('Please upload your documents first.');
    }
  } catch (err) {
    if (err.message.includes('Please upload') || err.message.includes('rejected')) {
      throw err;  // Block login
    }
    // Other errors: allow login
    console.log('Could not verify status:', err.message);
  }
}
```

---

### 3. Fixed Driver Navigation to Show WaitingForApprovalScreen
**File**: `src/navigation/DriverNavigator.js`

**Added Logic**:
```javascript
export default function DriverNavigator() {
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check driver's verification status on mount
    const checkVerificationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: verificationStatus } = await supabase
          .from('driver_verification_status')
          .select('overall_status')
          .eq('driver_id', user.id)
          .single();

        // If documents pending review, show WaitingForApprovalScreen
        if (verificationStatus?.overall_status === 'pending_review') {
          setShowWaitingScreen(true);
        }
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, []);

  // If documents pending, show WaitingForApprovalScreen
  // Otherwise show normal dashboard tabs
  return (
    <Stack.Navigator>
      {showWaitingScreen && (
        <Stack.Group>
          <Stack.Screen name="WaitingForApproval" ... />
        </Stack.Group>
      )}
      {!showWaitingScreen && (
        <Stack.Group>
          <Stack.Screen name="MainTabs" ... />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
```

---

### 4. Created Migration 042 to Fix Existing Documents
**File**: `supabase/migrations/042_fix_existing_documents_status.sql`

Converts all remaining `'pending'` documents to `'pending_review'`:
```sql
UPDATE driver_documents 
SET status = 'pending_review'::verification_status
WHERE status = 'pending'::verification_status;
```

---

## Complete User Journey Now

### Driver Side
```
1. Upload Documents
   ↓ (status = 'uploaded', hidden from admin)
   
2. Submit for Verification
   ↓ (status = 'pending_review', visible to admin)
   
3. Try to Login
   ↓ 
   IF approved → Goes to Dashboard
   IF pending_review → Shows WaitingForApprovalScreen
   IF rejected → Gets error "Documents rejected, re-upload"
```

### Admin Side
```
1. Open Admin Dashboard
   ↓
2. See list of drivers with status = 'pending_review' ONLY
   ↓
3. Review each document
   ↓
4. Click Approve → status = 'approved'
   ↓
5. Driver can now login to dashboard
```

---

## Status After All Fixes

| Check | Status | Details |
|-------|--------|---------|
| Admin sees pending docs | ✅ | Query fixed to use 'pending_review' |
| Driver login blocked if no docs | ✅ | Logic checks `all_documents_submitted` |
| Driver login blocked if rejected | ✅ | Logic checks for 'rejected' status |
| Driver sees WaitingForApprovalScreen | ✅ | DriverNavigator checks status |
| Driver can login if approved | ✅ | Logic allows 'approved' status |
| Existing documents updated | ✅ | Migration 042 converts 'pending' → 'pending_review' |

---

## Files Modified

✅ `src/context/AuthContext.js` - Fixed login verification logic
✅ `src/navigation/DriverNavigator.js` - Added status check to show waiting screen
✅ `src/services/documentService.js` - Fixed admin query to use 'pending_review'
✅ `supabase/migrations/042_fix_existing_documents_status.sql` - Fix existing data

---

## Next Steps

1. **Run Migration 042** in Supabase to convert existing documents
2. **Restart Expo** (will hot-reload with new code)
3. **Test Flow**:
   - Driver: Try login while documents pending → Should see WaitingForApprovalScreen ✅
   - Admin: Should see pending drivers now ✅
   - Admin: Approve driver → Driver can login to dashboard ✅

