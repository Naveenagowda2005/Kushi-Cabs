# Google Play Store Publication Guide - KUSHI CABS

## Prerequisites
- ✅ Google Play Developer Account ($25 already paid)
- ✅ expo-notifications removed (done)
- ✅ App is ready for build

---

## Step 1: Create Signing Key (One-time)

This creates a unique key that signs your app. Do this ONCE and keep it safe!

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified

# Create keystore (interactive - answer the prompts)
keytool -genkey -v -keystore release-key.keystore -keyalg RSA -keysize 2048 -validity 10000

# When prompted, enter:
# - Password: (create a strong password - SAVE THIS!)
# - First/Last Name: Praveen Kumar K R
# - Organization: KUSHI CABS
# - City/State/Country: India
# - Common Name confirmation: yes
# - Password: (same as before)
```

**IMPORTANT:** Save the keystore file and password somewhere safe! You'll need it for future updates.

---

## Step 2: Build APK for Testing (Local)

Test the app before submitting to Play Store:

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified

# Build APK (for local testing)
eas build --platform android --local

# Or without EAS (if you have Android SDK):
# expo build:android -t apk
```

This creates an APK file you can test on your phone.

---

## Step 3: Build App Bundle for Play Store

Google Play requires an **App Bundle (AAB)**, not APK:

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified

# Build App Bundle
eas build --platform android

# This will:
# 1. Ask for your Expo account
# 2. Build the app
# 3. Generate .aab file (download from Expo dashboard)
# 4. Take ~10-15 minutes
```

---

## Step 4: Prepare Store Listing

**In Google Play Console:**

1. **Create App → KUSHI CABS**
2. **Fill Basic Info:**
   - App name: Kushi Cabs
   - Default language: English
   - App category: Transportation
   - Content rating: PEGI 3

3. **Upload App Bundle:**
   - Go to Release → Production
   - Upload your .aab file
   - Wait for review (~1-3 hours)

4. **Add App Details:**
   - **Description:** 
     "Kushi Cabs - Your trusted taxi service. Book rides, track drivers in real-time, and manage your account easily."
   - **Screenshots:** (minimum 2, max 8)
     - Driver signup screen
     - Trip acceptance screen
     - Map view
   - **Feature graphic:** (1024x500px banner)
   - **Privacy policy:** Add your privacy policy URL

5. **Pricing & Distribution:**
   - Free app
   - Available in all countries

---

## Step 5: Submit for Review

1. **Check all requirements:**
   - ✅ Content rating
   - ✅ Pricing
   - ✅ Target audience
   - ✅ Screenshots/descriptions

2. **Click "Manage Release" → "Create Release"**
   - Add release notes: "Initial release - Taxi booking app"
   - Review and confirm

3. **Submit for review**
   - **Review time:** 24-48 hours typically

---

## Step 6: After Approval

Once approved:
- ✅ App goes live on Play Store
- ✅ Users can search and download
- ✅ Monitor ratings and reviews

---

## Important Files

- **release-key.keystore** - Keep safe! Needed for ALL future updates
- **.aab file** - Submit to Play Store

---

## App Details for Play Store

| Field | Value |
|-------|-------|
| App Name | Kushi Cabs |
| Package Name | com.kushicabs.unified |
| Version Code | 1 |
| Version Name | 1.0.0 |
| Min Android | 5.0 (API 21) |
| Target Android | 14+ (API 34+) |
| Category | Transportation |
| Content Rating | PEGI 3 |

---

## Current Status

- ✅ App code ready
- ✅ expo-notifications removed
- ✅ Account verification in progress (Google will email when done)
- ⏳ Ready to build when you say go!

---

## Next Steps

1. Wait for Google account verification (email will come)
2. Once verified, run Step 2-3 above to build
3. Upload to Play Store
4. Wait for review (~24-48 hours)
5. App goes live! 🎉

**Questions?** Ask before starting the build process.

