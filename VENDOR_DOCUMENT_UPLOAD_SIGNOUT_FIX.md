# Vendor Document Upload Sign Out Button - COMPLETE

## Changes Made

### File: `newtaxi/apps/unified/src/screens/vendor/VendorDocumentUploadScreen.js`

1. **Added useLayoutEffect import** (Line 9)
   - Added `useLayoutEffect` to the imports from `@react-navigation/native`

2. **Added Sign Out button to header** (Lines 33-50)
   - Used `useLayoutEffect` hook to set header right button
   - Sign Out button appears at top right corner of the screen
   - Button shows as a red logout icon (Ionicons log-out-outline)
   - Clicking shows confirmation alert before signing out

## User Flow

1. Vendor logs in → redirected to Upload Documents screen
2. At the top right corner → Sign Out button (red logout icon)
3. Vendor can click it anytime to sign out
4. Confirmation alert appears before logout
5. Upon confirmation → User is signed out and returned to login

## Header Button Details

- **Position**: Top right corner (headerRight)
- **Icon**: `log-out-outline` from Ionicons
- **Color**: Red (#f44336) to indicate sign out action
- **Size**: 24px
- **Behavior**: Taps to sign out with confirmation

## Technical Implementation

The button is added using React Navigation's `useLayoutEffect` hook:
```javascript
useLayoutEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity
        style={{ marginRight: 16, padding: 8 }}
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: () => signOut(),
            },
          ]);
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="#f44336" />
      </TouchableOpacity>
    ),
  });
}, [navigation, signOut]);
```

## Status
✅ **COMPLETE** - Sign Out button added to top right of Upload Documents screen header
