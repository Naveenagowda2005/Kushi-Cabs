# Kushi-Cabs Project - Complete Analysis & Build Guide

## 📋 Executive Summary

**Kushi-Cabs** is a production-ready **ride-sharing mobile application** built with React Native (Expo), featuring a multi-role platform for drivers, vendors (fleet operators), and administrators.

**Tech Stack:**
- **Frontend**: React Native 0.73.6 + Expo 54.0.36 (iOS & Android)
- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL-based BaaS with real-time subscriptions)
- **Payments**: PhonePe integration + Razorpay
- **Maps**: Google Maps API
- **Auth**: Supabase Phone/Email authentication with OTP

---

## 🏗️ Project Architecture

### Directory Structure

```
Kushi-Cabs/
│
├── backend/                              # Node.js Express API Server
│   ├── index.js                         # Server entry point
│   ├── routes/                          # API endpoints
│   │   ├── sms.js                      # OTP service via STPL gateway
│   │   ├── admin.js                    # Admin operations
│   │   ├── phonepe-payment.js          # PhonePe payment gateway
│   │   ├── document-upload.js          # Document verification storage
│   │   ├── trips.js                    # Trip management
│   │   ├── storage-migration.js        # Migrate data to S3/Storage
│   │   └── database-optimization.js    # DB performance tuning
│   ├── services/                        # Reusable business logic
│   │   ├── otpService.js               # OTP generation
│   │   └── stplSmsService.js           # SMS gateway integration
│   ├── package.json
│   ├── .env.example
│   └── Procfile                        # Deployment config
│
├── newtaxi/                             # Monorepo - Frontend (React Native)
│   ├── apps/
│   │   └── unified/                    # Single unified app (all roles)
│   │       ├── src/
│   │       │   ├── screens/            # Screen components
│   │       │   ├── components/         # Reusable UI components (50+)
│   │       │   ├── navigation/         # React Navigation config
│   │       │   ├── services/           # Supabase queries, API calls
│   │       │   ├── context/            # Auth, Theme, Global state
│   │       │   ├── hooks/              # Custom React hooks
│   │       │   ├── lib/                # Utilities & helpers
│   │       │   └── styles/             # Theme & colors
│   │       │
│   │       ├── android/                # Android native config
│   │       │   ├── app/                # Android app module
│   │       │   ├── build.gradle        # Gradle configuration
│   │       │   ├── gradle/             # Gradle wrappers
│   │       │   └── settings.gradle     # Project settings
│   │       │
│   │       ├── app.json                # Expo configuration
│   │       ├── eas.json                # Expo build settings
│   │       ├── package.json            # Dependencies
│   │       ├── package-lock.json
│   │       ├── babel.config.js         # Babel transpilation config
│   │       ├── metro.config.js         # React Native bundler config
│   │       └── [test/debug scripts]
│   │
│   ├── packages/
│   │   └── shared/                     # Shared utilities
│   │       ├── Supabase client init
│   │       ├── Constants & types
│   │       └── Shared utilities
│   │
│   └── supabase/
│       ├── migrations/                 # 113 SQL migration files
│       │   ├── 001_initial_schema.sql
│       │   ├── 002_rls_policies.sql
│       │   ├── 003_accept_trip_function.sql
│       │   ├── ...
│       │   └── [More migrations]
│       └── scripts/                    # Database setup scripts
│
├── .gitignore
├── Procfile                            # Heroku/Railway deployment
├── nixpacks.toml                       # Railway build config
├── render.yaml                         # Render.com deployment
└── [Setup & Documentation]
```

---

## 💾 Database Schema (Supabase)

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | Multi-role user profiles | id, phone, email, role, created_at |
| `vendors` | Fleet operators/taxi companies | id, name, gstin, bank_details |
| `drivers` | Driver information | id, user_id, vehicle_type, documents |
| `trips` | Ride bookings with lifecycle | id, driver_id, vendor_id, start_lat, end_lat, status |
| `payment_orders` | PhonePe payment tracking | id, user_id, amount, order_id, status |
| `wallet_transactions` | User wallet history | id, user_id, amount, type, reference |
| `driver_documents` | License, insurance, registration | id, driver_id, doc_type, storage_path, status |
| `vendor_documents` | Business docs verification | id, vendor_id, doc_type, storage_path, status |
| `active_sessions` | Single device login tracking | id, user_id, device_token, created_at |
| `app_settings` | Global configuration | key, value |

### Storage Buckets

- **odometer-images** - Trip odometer photos (public read, auth write)
- **driver-avatars** - Driver profile pictures
- **vendor-documents** - Business document storage
- **trip-receipts** - Payment receipts

### Key Features

✅ **Row-Level Security (RLS)**: Role-based data visibility
✅ **Real-time Subscriptions**: Live trip updates, notifications
✅ **113+ Migrations**: Complete schema evolution
✅ **Functions & Triggers**: Auto-calculated commissions, wallet updates

---

## 📱 Frontend Architecture

### App Roles & Navigation

1. **Driver** - Accept trips, upload odometer, complete trips, view earnings
2. **Vendor** - Create trips, manage drivers, view analytics
3. **Admin** - Approve vendors, manage payments, view system stats
4. **Super Admin** - Full system access, user management

### Key Screens

**Driver Screens:**
- `DriverDashboard` - Available trips, earnings summary
- `TripDetail` - Trip information, route map
- `OdometerCapture` - Start/end odometer photo upload
- `WalletScreen` - Balance, transaction history
- `ProfileScreen` - Document upload, profile edit

**Vendor Screens:**
- `VendorDashboard` - Trip creation, driver management
- `EnquiryList` - Customer trip enquiries
- `TripManagement` - Assign trips to drivers
- `AdminPanel` - Vendor-level analytics

**Admin Screens:**
- `AdminDashboard` - System overview, KPIs
- `UserManagement` - Approve/reject users
- `PaymentControl` - PhonePe settlements
- `Analytics` - Trip volumes, revenue

### Component Library (50+ Components)

**Common Components:**
- `AnimatedButton` - Button with loading states
- `FloatingBubble` - Floating action button
- `DocumentUploadCard` - File upload UI
- `TripCard` - Trip information display
- `MapView` - Route visualization
- `BottomSheet` - Modal actions
- `LoadingSpinner` - Loading indicator
- [40+ more]

### State Management

- **React Context API** - Authentication, Theme, Global state
- **Async Storage** - Local persistence
- **Supabase Real-time** - Live data subscriptions

---

## 🔌 Backend API (Node.js + Express)

### Running Environment

- **Port**: 3001 (configurable via .env)
- **Framework**: Express.js
- **Database**: Supabase (via @supabase/supabase-js)
- **Deployment**: Railway, Render, or Heroku

### API Routes & Endpoints

#### SMS & Authentication
```
POST   /api/sms/send-otp              - Send OTP to phone
POST   /api/sms/verify-otp            - Verify OTP code
```

#### Admin Operations
```
POST   /api/admin/create-user         - Create new user (admin only)
POST   /api/admin/approve-vendor      - Approve vendor registration
POST   /api/admin/delete-user         - Remove user account
GET    /api/admin/users               - List all users
```

#### PhonePe Payment
```
POST   /api/phonepe/create-order      - Initiate payment
GET    /api/phonepe/order-status/:id  - Check payment status
POST   /api/phonepe/webhook           - Payment callback
```

#### Documents
```
POST   /api/documents/upload          - Upload verification doc
GET    /api/documents/list/:userId    - List user documents
POST   /api/documents/migrate         - Migrate docs to Storage
```

#### Trips
```
GET    /api/trips/list                - List all trips
GET    /api/trips/count               - Trip count stats
GET    /api/trips/filter              - Filter trips by criteria
GET    /api/trips/analytics           - Analytics data
```

#### Database Optimization
```
POST   /api/db/create-indexes         - Create performance indexes
GET    /api/db/table-stats            - Table statistics
```

---

## 🛠️ Dependencies & Versions

### Frontend Dependencies (React Native)

**Core Framework:**
```
expo 54.0.36                           - Managed React Native platform
react-native 0.73.6                    - Native framework
react 18.2.0                           - React library
```

**Navigation:**
```
@react-navigation/* 6.x                - Stack/Tab/Drawer navigation
react-native-gesture-handler 2.14.0    - Touch gestures
react-native-reanimated 3.5.0          - Smooth animations
```

**Features:**
```
@supabase/supabase-js 2.105.4          - Database & Auth
expo-location 19.0.8                   - GPS & geolocation
expo-image-picker 17.0.11              - Photo/video selection
react-native-maps 1.8.0                - Map display
expo-notifications 0.32.17             - Push notifications
expo-av 16.0.8                         - Audio/video playback
```

**Payments:**
```
react-native-razorpay 3.0.0            - Razorpay payment gateway
```

**Storage & State:**
```
@react-native-async-storage/async-storage 2.2.0
```

### Backend Dependencies (Node.js)

```
express 4.18.4                         - Web framework
@supabase/supabase-js 2.38.0          - Database client
cors 2.8.5                             - CORS middleware
dotenv 16.3.1                          - Environment config
axios 1.6.5                            - HTTP client
ws 8.14.2                              - WebSocket support
nodemon 3.0.1                          - Dev auto-reload
```

---

## 🚀 Build & Deployment Platforms

### Supported Platforms

| Platform | Config File | Status |
|----------|------------|--------|
| **Railway.app** | `nixpacks.toml` | ✅ Primary |
| **Render.com** | `render.yaml` | ✅ Active |
| **Heroku** | `Procfile` | ✅ Legacy |
| **Local Dev** | npm scripts | ✅ Dev |

### Environment Variables

**Frontend (.env in app root):**
```
EXPO_PUBLIC_SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms
EXPO_PUBLIC_SMS_API_URL=https://kushi-cabs-27p8.onrender.com
```

**Backend (.env in backend root):**
```
SUPABASE_URL=https://cqfsirfjwfxvwggjkrvd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STPL_SMS_USERNAME=your_stpl_username
STPL_SMS_PASSWORD=your_stpl_password
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_API_KEY=your_api_key
PHONEPE_API_URL=https://api.phonepe.com/apis/hermes
PORT=3001
```

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| **Total Files** | 614 files |
| **Markdown Docs** | 481 files |
| **SQL Migrations** | 113 files |
| **Source Code** | ~100 JS/Kotlin files |
| **UI Components** | 50+ components |
| **Database Tables** | 15+ tables |
| **API Endpoints** | 30+ endpoints |
| **App Roles** | 4 (Driver, Vendor, Admin, Super Admin) |
| **Auth Method** | Phone OTP + Email |
| **Payment Gateways** | PhonePe + Razorpay |

---

## 🔐 Security Features

✅ **Row-Level Security (RLS)** - Supabase policies for role-based access
✅ **Phone OTP Auth** - SMS-based two-factor authentication
✅ **Single Device Login** - Prevent multi-device access
✅ **JWT Tokens** - Secure API communication
✅ **Environment Variables** - Secrets in .env files
✅ **CORS Protection** - Cross-origin request control
✅ **Document Verification** - Admin approval for uploads

---

## 📝 Key Features

### 1. **Trip Management**
- Real-time trip creation and assignment
- Odometer-based distance tracking
- Trip status lifecycle (pending → accepted → started → completed)
- Driver rating and review system

### 2. **Wallet System**
- Auto-calculated commissions
- Manual wallet top-up via PhonePe
- Transaction history & statements
- Withdrawal to bank account

### 3. **Document Verification**
- Driver: License, Insurance, Registration
- Vendor: GSTIN, Business License, Insurance
- Admin approval workflow
- Storage in Supabase buckets

### 4. **Real-time Features**
- Live trip updates via Supabase subscriptions
- Push notifications for trip acceptance
- Real-time driver location tracking
- Live wallet updates

### 5. **Admin Panel**
- User management (create, approve, delete)
- Payment processing & settlements
- Analytics & reporting
- System configuration

### 6. **Payment Integration**
- PhonePe secure payment gateway
- Order tracking & status checking
- Payment webhook callbacks
- Receipt generation

---

## 🔧 Development Tools & Commands

### Frontend Commands

```bash
# Install dependencies
npm install

# Start Expo dev server on LAN
npm start                    # Expo server on metro bundler

# Run on Android (native build)
npm run android              # Compiles with Gradle

# Build APK for distribution
eas build --platform android --profile production

# Build for simulator/emulator
npm run android              # Debug APK

# Check database setup
node check-database.js
node check-schema.js

# Test authentication flow
node test-phone-auth.js
node test-driver-signup.js
```

### Backend Commands

```bash
# Install dependencies
npm install

# Start dev server with auto-reload
npm run dev                  # Uses nodemon

# Start production server
npm start                    # Node index.js

# Check environment
npm run check-env
```

### Database Commands

```bash
# List all migrations in supabase/migrations/
ls supabase/migrations/

# Apply migration manually via Supabase SQL Editor
# Copy entire migration file and run in SQL editor

# Run setup script
node setup-superadmin.js
```

---

## 📱 Build Configuration Files

### `app.json` (Expo Config)
- App name: "Kushi Cabs"
- Package: "com.Kushi_Cabs"
- Android version code: 18
- Permissions: Location, Audio
- Google Maps API configured
- Plugins: expo-location, expo-font

### `eas.json` (Expo Build Service)
- **Development**: Development client build
- **Preview**: Internal testing distribution
- **Production**: Release build with auto-increment version
- Environment variables for production Supabase

### `android/build.gradle`
- Gradle: 8.1.3
- React Native Gradle Plugin: 0.73.4
- Kotlin: 1.9.10
- Repositories: Google, Maven Central, JitPack

### `package.json`
- 30+ production dependencies
- Build scripts configured for Expo
- Node version: 20.12.2 (for production builds)

---

## 📦 Deployment Status

### Current Setup
- ✅ Frontend: Expo managed (iOS & Android)
- ✅ Backend: Node.js on Railway/Render
- ✅ Database: Supabase Cloud
- ✅ Payments: PhonePe (Production)
- ✅ Auth: Supabase Phone Auth

### Recent Production Build Info
```
App Version: 1.0.0
Android Version Code: 18
Package Name: com.Kushi_Cabs
Latest Node: 20.12.2
Supabase URL: cqfsirfjwfxvwggjkrvd.supabase.co
SMS API: kushi-cabs-27p8.onrender.com
```

---

## 🎯 Next Steps for Development

1. ✅ Backend server is running on Render
2. ✅ Supabase database is active with migrations applied
3. 🔄 Frontend can be built locally via EAS or native Gradle
4. 📱 APK can be built and installed via WiFi ADB
5. 🧪 Testing on physical device recommended

---

## ⚡ Quick Start for Building APK

See: `APK_BUILD_WIFI_INSTALLATION_GUIDE.md`

