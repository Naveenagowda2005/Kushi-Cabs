# ✅ Odometer Bucket - ACTION STEPS

## 🎯 What You Need To Do (5 minutes)

### STEP 1: Create the Bucket in Supabase
**Time: 2 minutes**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New query"** button
5. Paste this SQL:

```sql
-- Create odometer-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'odometer-images',
  'odometer-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drivers can upload their own odometer images
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
CREATE POLICY "Drivers can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'odometer-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role_id = (SELECT id FROM public.roles WHERE name = 'driver')
    )
  );

-- All authenticated users can view odometer images
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
CREATE POLICY "Authenticated users can view odometer images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'odometer-images');

-- Drivers can update/replace their own images
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
CREATE POLICY "Drivers can update odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'odometer-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role_id = (SELECT id FROM public.roles WHERE name = 'driver')
    )
  );

SELECT 'Bucket created successfully!' AS status;
```

6. Click **"Run"** button (keyboard: `Cmd+Enter` or `Ctrl+Enter`)
7. You should see: **"Bucket created successfully!"**

---

### STEP 2: Verify Bucket in Dashboard
**Time: 1 minute**

1. Click **"Storage"** in left sidebar
2. You should see **"odometer-images"** bucket
3. Click on it to verify:
   - **Public**: ✅ ON (blue toggle)
   - **File size limit**: 5 MB
   - **Allowed types**: JPEG, PNG, WebP

---

### STEP 3: Restart Your App
**Time: 30 seconds**

1. Stop the running app (if dev mode is on)
2. Restart: `npm start` (or your start command)
3. Clear app cache if needed (force reload)

---

### STEP 4: Test Driver Upload Flow
**Time: 2 minutes**

#### A. Create Test Trip
1. Login as **Super Admin**
2. Go to **Trips** screen
3. Click **"Create Admin Trip"** (if available)
4. Fill in details, click **"Create"**
5. You should see a **pending trip**

#### B. Accept and Start Trip (as Driver)
1. Logout from admin
2. Login as **Driver**
3. Go to **Available Trips**
4. Find and **accept** the trip
5. Click **"Start Trip"**

#### C. Capture Start Odometer
1. Click **"Capture Start Odometer"**
2. Phone camera should open
3. Take a photo of something (test photo)
4. Click ✅ to confirm
5. Enter start KM (e.g., "100")
6. Click **"Start Trip"**
7. **Wait for upload** (should see loading)
8. ✅ Trip should move to "In Progress"

#### D. Capture End Odometer
1. Click **"End Trip"**
2. Click **"Capture End Odometer"**
3. Take another photo
4. Enter end KM (e.g., "150")
5. Click **"Complete Trip"**
6. ✅ Trip should move to "Completed"

---

### STEP 5: Verify Images in Admin Screen
**Time: 1 minute**

1. Logout from driver
2. Login as **Super Admin**
3. Go to **Trips** screen
4. Change filter to **"Completed"**
5. Find the trip you just completed
6. Scroll down to **"Odometer Images"** section
7. You should see:
   - ✅ Start odometer image thumbnail
   - ✅ End odometer image thumbnail
   - ✅ Both have zoom controls
   - ✅ Can click to view full size

---

### STEP 6: Check Database
**Time: 1 minute (optional)**

Verify URLs are stored (not base64):

```sql
-- Run in SQL Editor
SELECT 
  id,
  booking_id_seq,
  status,
  start_odometer_url,
  end_odometer_url
FROM trips
WHERE status = 'completed'
LIMIT 5;

-- Expected: URLs like
-- https://your-project.supabase.co/storage/v1/object/public/odometer-images/...
-- NOT base64 strings starting with "data:image/jpeg;base64,iVBORw0KGgo..."
```

---

## ✅ What Should Work After Setup

| Feature | Expected Behavior |
|---------|-------------------|
| Driver captures image | ✅ Camera opens, can take photo |
| Image uploads | ✅ Shows loading spinner |
| URL saved to DB | ✅ `start_odometer_url` contains public URL |
| Admin views trip | ✅ Odometer images section visible |
| Admin sees thumbnails | ✅ Both start and end images show |
| Admin zooms image | ✅ Can pinch/zoom and pan |
| Query trips | ✅ < 1 second (no timeout) |

---

## ❌ If Something Doesn't Work

### "Migration already exists error"
✅ That's fine - it means the bucket already exists. Just verify it in Storage section.

### "Upload fails - permission denied"
- ✅ Verify you're logged in as a driver
- ✅ Restart the app
- ✅ Check `role_id = 'driver'` in users table

### "Image won't display in admin"
- ✅ Check the image URL in database (should start with `https://`)
- ✅ Try opening the URL in browser directly
- ✅ Check image was actually uploaded (see below)

### "Can't see trip with images"
- ✅ Make sure trip status is "completed"
- ✅ Try scrolling down on trip card
- ✅ Check filter is set to "all" or "completed"

### "Query still times out"
- ✅ Check old trips don't have huge base64 strings
- ✅ Run this SQL to fix old trips:
```sql
UPDATE trips 
SET start_odometer_url = NULL,
    end_odometer_url = NULL
WHERE start_odometer_url LIKE 'data:image%'
  OR end_odometer_url LIKE 'data:image%';
```

---

## 🔍 Debug: Check Bucket Contents

```sql
-- See all files uploaded to odometer-images bucket
SELECT 
  name,
  size_bytes,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'odometer-images'
ORDER BY created_at DESC
LIMIT 10;
```

Expected output:
```
name                              | size_bytes | created_at
──────────────────────────────────┼────────────┼─────────────
uuid-1234/start_1722689500000.jpg | 45000      | 2026-08-02 12:30:00
uuid-1234/end_1722689600000.jpg   | 48000      | 2026-08-02 12:35:00
```

---

## 🎯 Complete Checklist

- [ ] Run migration SQL in SQL Editor
- [ ] See ✅ "Bucket created successfully!"
- [ ] Verify bucket in Storage section
- [ ] Restart app
- [ ] Test driver upload flow
- [ ] Verify images show in admin screen
- [ ] Check database has URLs (not base64)
- [ ] Query trips is fast (no timeout)

---

## 📞 Quick Reference

| Task | Command/Location |
|------|------------------|
| Apply migration | SQL Editor → Run migration |
| Verify bucket | Storage section → odometer-images |
| Test upload | Login as driver → Start trip |
| View images | Admin → Trips → Completed → Scroll down |
| Check database | SQL Editor → Query trips table |
| Fix permissions | Update role_id to 3 (driver) |
| Delete old images | Storage → odometer-images → Delete |

---

## 🚀 You're Done!

Once all steps are complete:
✅ Odometer images upload to bucket
✅ URLs stored in database (not base64)
✅ Admin can view images with zoom
✅ Queries are fast (no timeouts)
✅ Production ready!
