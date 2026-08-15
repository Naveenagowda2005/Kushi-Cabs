# Manual Migration: Add hills_included Column

## Option 1: Via Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "+ New Query" button
4. Paste the following SQL:

```sql
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS hills_included BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.trips.hills_included IS 'Whether hills charge is included in the trip fare';
```

5. Click "Run" button (or Ctrl+Enter)
6. You should see a message: "success: 200 OK"

## Option 2: Via psql (If you have direct DB access)

```bash
psql -h db.vofupwsnbcidjnifaihm.supabase.co -U postgres -d postgres -c "ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS hills_included BOOLEAN DEFAULT FALSE;"
```

## After Migration

The app will automatically work with the new column. Reload the app and try creating a new trip with the hills charge toggle.

## Status

- Migration file created: `066_add_hills_included_to_trips.sql`
- Frontend code: ✅ Ready (fields already implemented)
- Database schema: ⏳ Waiting for migration to run
