# Build Instructions - Kushi Cabs App

## Production Build Status

✅ **Ready for Production**

All code changes have been committed and pushed. The application is configured to use the production Railway backend.

## Build Configuration

### Environment Variables (Already Set)
- **Backend API**: `https://kushi-cabs-production.up.railway.app`
- **Supabase URL**: `https://cqfsirfjwfxvwggjkrvd.supabase.co`
- **Google Maps API**: Configured

### Build Tools
- **Framework**: React Native with Expo
- **Build System**: EAS (Expo Application Services)
- **Version**: 1.0.0

## How to Build

### Option 1: Build Locally (Android)
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
npm install
eas build --platform android --profile production
```

### Option 2: Build Locally (iOS)
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
npm install
eas build --platform ios --profile production
```

### Option 3: Build via EAS Cloud (Recommended)
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
eas build --platform all --profile production
```

## Production Profile Configuration

The `eas.json` file is configured with production settings:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SMS_API_URL": "https://kushi-cabs-production.up.railway.app"
      }
    }
  }
}
```

## Build Output

### Android
- **Format**: APK/AAB (for Play Store)
- **Signing**: Automatically signed with production key
- **Output**: Ready for Google Play Store submission

### iOS
- **Format**: IPA (for App Store)
- **Signing**: Automatically signed with production certificate
- **Output**: Ready for Apple App Store submission

## Pre-Build Checklist

✅ All code changes committed and pushed  
✅ Production backend URL configured  
✅ Environment variables set in eas.json  
✅ Dependencies installed  
✅ No build errors or warnings  
✅ Code formatted and tested  

## Recent Changes Included in Build

1. **Foreign Key Constraint Fix** - Enhanced error handling
2. **Stuck Registration Recovery** - User-facing recovery button
3. **Commission Screen Booking ID Display** - Formatted IDs (KUSH-B-X)
4. **Production Backend Configuration** - Railway endpoint
5. **Improved Error Messages** - Clear user feedback

## Next Steps After Building

1. **Testing**: Install APK/IPA on device and test
2. **Store Submission**: 
   - Android: Submit to Google Play Store
   - iOS: Submit to Apple App Store
3. **Monitoring**: Monitor backend logs at https://kushi-cabs-production.up.railway.app
4. **User Communication**: Notify users of new version

## Build Troubleshooting

### If EAS is not installed:
```bash
npm install -g eas-cli
eas login
```

### If build fails:
1. Clear cache: `expo cache --clear`
2. Clean install: `rm -rf node_modules && npm install`
3. Check error logs from EAS

### For Android-specific issues:
- Ensure Android SDK is properly configured
- Check Java version compatibility

### For iOS-specific issues:
- Ensure Xcode is installed and up-to-date
- Check provisioning profiles in Apple Developer account

## Production Backend Information

**URL**: https://kushi-cabs-production.up.railway.app

**Endpoints Available**:
- `/sms/otp` - Send OTP
- `/sms/verify` - Verify OTP
- `/admin/create-driver-account` - Create driver auth account
- `/admin/create-dummy-driver` - Create test driver
- `/admin/create-dummy-vendor` - Create test vendor
- `/admin/create-admin-trip` - Create admin-assigned trip

## Deployment Status

🚀 **Ready to Deploy**

All fixes have been implemented and tested. The application is ready for:
- Beta testing
- Play Store submission
- App Store submission

## Support

For build issues or questions:
1. Check EAS documentation: https://docs.expo.dev/eas/
2. Review error logs from build output
3. Contact development team with build error details
