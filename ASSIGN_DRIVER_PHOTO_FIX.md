# AssignDriver Screen - Photo Loading Fix & Dummy Driver Filter

## Problems Fixed

### 1. Driver Photos Not Loading
**Root Cause**: 
- Was querying with `eq('user_id', user.id)` but the column is `driver_id`
- Was looking for wrong data structure (documents.DRIVER_SELFIE.url as JSON object)
- Photo data stored as base64 or data URL, not as separate URL fields

**Solution**:
- Query `driver_documents` table using `driver_id` (which references users.id)
- Filter for `document_type = 'DRIVER_SELFIE'`
- Extract from `document_data` field and convert base64 to data URL format

### 2. Dummy Drivers Appearing in List
**Root Cause**: 
- The `.not('full_name', 'ilike', '%dummy%')` filter wasn't working properly

**Solution**:
- Changed to `.filter('full_name', 'not.ilike', '%dummy%')` syntax
- Added client-side fallback filtering: `!(d.users?.full_name?.toLowerCase().includes('dummy'))`
- Logs how many dummy drivers were filtered out

## Code Changes

### Database Query Fix
```javascript
// ✅ BEFORE (wrong):
.eq('user_id', user.id)
.not('full_name', 'ilike', '%dummy%')

// ✅ AFTER (correct):
.eq('user_id', user.id)
.filter('full_name', 'not.ilike', '%dummy%')
```

### Photo Loading Fix
```javascript
// ✅ Query driver_documents with driver_id
const { data: driverDocs } = await supabase
  .from('driver_documents')
  .select('document_data, document_mime_type, document_type')
  .eq('driver_id', user.id)              // ✅ Correct column
  .eq('document_type', 'DRIVER_SELFIE')  // ✅ Filter for selfie
  .maybeSingle();

// ✅ Convert base64 to data URL format
if (driverDocs?.document_data) {
  if (driverDocs.document_data.startsWith('data:')) {
    photoUrl = driverDocs.document_data;
  } else {
    const mimeType = driverDocs.document_mime_type || 'image/jpeg';
    photoUrl = `data:${mimeType};base64,${driverDocs.document_data}`;
  }
}
```

### Client-Side Filtering
```javascript
// ✅ Double-check to exclude any dummy drivers
const validDrivers = driversWithDetails
  .filter(d => d !== null && !(d.users?.full_name?.toLowerCase().includes('dummy')))
  .sort((a, b) => (a.users?.full_name || '').localeCompare(b.users?.full_name || ''));

console.log(`✅ Loaded ${validDrivers.length} drivers (filtered ${driversWithDetails.length - validDrivers.length} dummy drivers)`);
```

## Testing Checklist
- [ ] AssignDriver screen loads without errors
- [ ] Real driver photos display correctly
- [ ] Placeholder icon shows for drivers without photos
- [ ] NO dummy drivers appear in the list
- [ ] Console logs show correct count of filtered drivers
- [ ] Search functionality still works
- [ ] Driver selection and assignment works

## Files Modified
- `newtaxi/apps/unified/src/screens/vendor/AssignDriverScreen.js`

## Related Implementation
- Super Admin DriversScreen also uses this same query pattern (source of reference)
- driver_documents table stores documents as base64/data URL in `document_data` field

