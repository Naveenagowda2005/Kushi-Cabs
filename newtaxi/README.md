# Taxi Service Management System

## Structure

```
taxi-system/
├── apps/
│   ├── driver/          # Driver Expo app
│   └── vendor/          # Vendor Expo app
├── packages/
│   └── shared/          # Supabase client, constants, types
└── supabase/
    └── migrations/      # Run these in order in Supabase SQL editor
```

## Setup

### 1. Supabase
1. Create a project at https://supabase.com
2. Run migrations in order via SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_accept_trip_function.sql`
   - `supabase/migrations/004_all_functions.sql`
3. Enable Phone Auth in Authentication > Providers
4. Create storage bucket named `odometer-images` (public read, authenticated write)

### 2. Driver App
```bash
cd apps/driver
cp .env.example .env
# Fill in your Supabase URL and anon key
npm install
npm start
```

### 3. Vendor App
```bash
cd apps/vendor
cp .env.example .env
# Fill in your Supabase URL and anon key
npm install
npm start
```

## Phases
- [x] Phase 1 — Project setup, Supabase schema, folder structure
- [x] Phase 2 — OTP Auth, role handling, navigation
- [x] Phase 3 — Driver dashboard, accept trip, wallet check
- [x] Phase 4 — Trip lifecycle (start/end odometer upload, complete)
- [x] Phase 5 — Vendor enquiries, create trip, accept trip
- [x] Phase 6 — Wallet system, transaction history, withdrawals
- [x] Phase 7 — Realtime subscriptions, push notifications
