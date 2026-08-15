# Delete Account Feature - Implementation Complete

## Overview
Added a "Delete Account" button to both Driver and Vendor profile screens that allows users to permanently delete their accounts.

## Changes Made

### 1. Driver Profile Screen
**File:** `newtaxi/apps/unified/src/screens/driver/ProfileScreen.js`

- Added import: `import { API_CONFIG } from '../../constants';`
- Added "Delete Account" button below "Sign Out" button
- Added `handleDeleteAccount()` function that:
  - Shows confirmation alert with warning message
  - Calls backend `/admin/delete-user` endpoint
  - Automatically signs out user after successful deletion
  - Handles errors gracefully

### 2. Vendor Profile Screen
**File:** `newtaxi/apps/unified/src/screens/vendor/ProfileScreen.js`

- Added import: `import { API_CONFIG } from '../../constants';`
- Added "Delete Account" button below "Sign Out" button (identical styling)
- Added `handleDeleteAccount()` function with same logic as driver

## UI/UX Details

### Button Styling
- **Color:** Dark red (#d32f2f) to indicate destructive action
- **Icon:** trash-outline
- **Position:** Below "Sign Out" button with spacing

### User Experience
1. User taps "Delete Account" button
2. Confirmation alert appears with warning message
3. If user confirms:
   - Request sent to backend: `POST /admin/delete-user`
   - Backend deletes all user data from Supabase
   - App automatically signs user out
   - Success message displayed
4. If user cancels: Nothing happens

## Backend Integration

The feature uses the existing `/admin/delete-user` endpoint in `backend/routes/admin.js` which:
- Accepts `userId`, `phone`, and `email`
- Checks for pending trips before deletion
- Deletes user from auth and database
- Cleans up all associated records

## Request Format

```javascript
POST /admin/delete-user
Content-Type: application/json

{
  "userId": "user-uuid",
  "phone": "10-digit-phone",
  "email": "phone@kushicabs.phone"
}
```

## Error Handling

- Network errors are caught and displayed
- Backend validation errors are shown to user
- Pending trips prevent deletion with descriptive message
- User remains logged in if deletion fails

## Testing Checklist

- [ ] Delete button appears on both driver and vendor profiles
- [ ] Confirmation alert appears when tapped
- [ ] Account is deleted successfully in Supabase
- [ ] User is signed out after deletion
- [ ] Error messages display correctly if deletion fails
- [ ] Pending trips prevent deletion with appropriate message
