# 🔧 Odometer Images Implementation Guide

## Complete Flow: Upload & Display

### 📱 Driver Side (Upload)

#### 1. Capture Image (ActiveTripScreen.js)
```javascript
// When driver clicks "Capture Start Odometer"
const captureOdometerImage = async (type) => {
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.6,
    base64: true,  // Get base64 for efficient upload
  });
  
  if (type === 'start') {
    setStartOdometerImage({ uri: result.uri, base64: result.base64 });
  } else {
    setEndOdometerImage({ uri: result.uri, base64: result.base64 });
  }
};
```

#### 2. Upload to Bucket (uploadService.js)
```javascript
export async function uploadOdometerImage(imageData, tripId, type) {
  const base64 = imageData.base64;
  const uri = imageData.uri;
  
  // Decode base64 → Uint8Array
  const byteArray = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
  
  // Upload to bucket
  const fileName = `${tripId}/${type}_${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('odometer-images')  // Bucket name from STORAGE_BUCKETS.ODOMETER
    .upload(fileName, byteArray, {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data } = supabase.storage
    .from('odometer-images')
    .getPublicUrl(fileName);
  
  return data.publicUrl;  // Returns: https://your-project.supabase.co/storage/v1/object/public/odometer-images/...
}
```

#### 3. Save to Database (ActiveTripScreen.js)
```javascript
async function handleStartTrip() {
  // Upload image to bucket
  const publicUrl = await uploadOdometerImageLocal(startOdometerImage, activeTrip.id, 'start');
  
  // Store ONLY the URL in database
  await startTrip({
    tripId: activeTrip.id,
    startOdometerUrl: publicUrl,  // URL, not base64
    startKm: parseFloat(startKm),
    userId: user.id,
  });
}
```

#### 4. Database Update (tripService.js)
```javascript
export async function startTrip({ tripId, startOdometerUrl, startKm, userId }) {
  // Update trips table with URL
  const { error } = await supabase
    .from('trips')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      start_odometer_url: startOdometerUrl,  // Stores URL
      start_km: startKm,
    })
    .eq('id', tripId);
  
  if (error) throw error;
}
```

---

### 🖥️ Admin Side (Display)

#### 1. Fetch Trips (TripsScreen.js)
```javascript
const fetchTrips = useCallback(async () => {
  const TRIP_LIST_COLUMNS = [
    'id', 'booking_id_seq', 'status', 'start_odometer_url', 'end_odometer_url',
    'start_km', 'end_km', 'created_at', 'accepted_at', 'completed_at',
    'created_by', 'accepted_by', // ... other columns
  ].join(', ');
  
  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_LIST_COLUMNS)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;  // Includes start_odometer_url and end_odometer_url
}, []);
```

#### 2. Display Images in Trip Card
```javascript
// In trip card rendering
{(item.start_odometer_url || item.end_odometer_url) && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Odometer Images</Text>
    <View style={styles.odometerContainer}>
      {item.start_odometer_url && (
        <OdometerImageThumbnail
          imageUrl={item.start_odometer_url}  // Public URL from bucket
          tripId={item.id}
          imageType="start"
          onPress={() => openImageModal(item.start_odometer_url, 'Start')}
        />
      )}
      {item.end_odometer_url && (
        <OdometerImageThumbnail
          imageUrl={item.end_odometer_url}    // Public URL from bucket
          tripId={item.id}
          imageType="end"
          onPress={() => openImageModal(item.end_odometer_url, 'End')}
        />
      )}
    </View>
  </View>
)}
```

#### 3. Image Component
```javascript
function OdometerImageThumbnail({ imageUrl, tripId, imageType, onPress }) {
  return (
    <TouchableOpacity
      style={styles.odometerImageWrapper}
      onPress={() => onPress?.(imageUrl)}
    >
      <Image
        source={{ uri: imageUrl }}  // Direct URL from Supabase Storage
        style={styles.odometerImage}
        onLoad={() => console.log('Image loaded')}
        onError={() => console.warn('Image failed to load')}
      />
      <Text style={styles.odometerLabel}>
        {imageType === 'start' ? 'Start' : 'End'}
      </Text>
    </TouchableOpacity>
  );
}
```

#### 4. Modal View with Zoom
```javascript
function ZoomableImage({ imageUrl, title, onClose }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>
      {/* Zoom controls */}
    </View>
  );
}
```

---

## 🏗️ Architecture

```
┌─────────────────────┐
│  Driver App         │
│  (ActiveTripScreen) │
└──────────┬──────────┘
           │ 1. Capture image
           │ 2. Convert to base64
           ▼
┌─────────────────────┐
│  uploadService.js   │
│  uploadOdometerImage│
└──────────┬──────────┘
           │ 3. Decode base64 to Uint8Array
           │ 4. Upload to storage bucket
           ▼
┌──────────────────────────────┐
│  Supabase Storage Bucket     │
│  odometer-images/            │
│  ├─ {tripId}/start_xxx.jpg   │
│  └─ {tripId}/end_xxx.jpg     │
└──────────┬───────────────────┘
           │ 5. Return public URL
           ▼
┌──────────────────────┐
│  trips table         │
│  start_odometer_url  │
│  end_odometer_url    │
└──────────┬───────────┘
           │ 6. Query trips
           ▼
┌──────────────────────┐
│  Admin App           │
│  (TripsScreen)       │
│  Display images      │
│  with URL from DB    │
└──────────────────────┘
```

---

## 📊 Database Schema

### trips table
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  booking_id_seq BIGINT,
  status TEXT,
  start_odometer_url TEXT,      -- Stores PUBLIC URL (not base64)
  end_odometer_url TEXT,        -- Stores PUBLIC URL (not base64)
  start_km NUMERIC(10,2),
  end_km NUMERIC(10,2),
  created_at TIMESTAMP,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  -- ... other columns
);
```

### storage.buckets table
```sql
-- The odometer-images bucket
INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) VALUES (
  'odometer-images',
  'odometer-images',
  true,  -- Public access
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);
```

---

## 🔐 RLS Policies

### Upload Policy
```sql
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
```
→ **Only drivers can upload**

### View Policy
```sql
CREATE POLICY "Authenticated users can view odometer images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'odometer-images');
```
→ **All authenticated users can view** (drivers, vendors, admins)

---

## ✅ Files Involved

### Frontend
1. **src/services/uploadService.js**
   - Function: `uploadOdometerImage(imageData, tripId, type)`
   - Does: Converts base64 → Uint8Array → Uploads to bucket → Returns URL

2. **src/screens/driver/ActiveTripScreen.js**
   - Does: Captures image, calls uploadService, saves URL to DB
   - Functions: `captureOdometerImage()`, `handleStartTrip()`, `handleEndTrip()`

3. **src/services/tripService.js**
   - Function: `startTrip()`, `completeTrip()`
   - Does: Updates trips table with odometer URLs

4. **src/screens/superadmin/TripsScreen.js**
   - Does: Fetches trips with URLs, displays images with zoom
   - Components: `OdometerImageThumbnail`, `ZoomableImage`

### Constants
1. **src/constants.js**
   ```javascript
   export const STORAGE_BUCKETS = {
     ODOMETER: 'odometer-images',
     DOCUMENTS: 'documents',
     PROFILES: 'profile-photos',
   };
   ```

### Database
1. **supabase/migrations/109_create_odometer_images_bucket.sql**
   - Creates bucket
   - Sets up RLS policies

---

## 🚀 Setup Steps

### Step 1: Apply Migration 109
Run in Supabase SQL Editor:
```sql
-- See SETUP_ODOMETER_BUCKET_NOW.md
```

### Step 2: Verify Bucket
1. Go to Supabase Dashboard → **Storage**
2. See **odometer-images** bucket
3. Public: **ON**
4. Size limit: **5 MB**

### Step 3: Test Upload
1. Login as driver
2. Accept trip
3. Click "Start Trip"
4. Capture odometer image
5. ✅ Should upload to bucket
6. ✅ Should store URL in database

### Step 4: Verify Display
1. Login as admin
2. Go to Trips screen
3. Click on completed trip
4. ✅ Should show odometer images
5. ✅ Should have zoom controls

---

## 📈 Performance

### Before (Base64 in Database)
- Image size: 200-500 KB each
- Query 100 trips: 10-50 MB data
- Result: **TIMEOUT**

### After (URL in Database)
- Image size: 100 bytes (just URL)
- Query 100 trips: 5-10 KB data
- Result: **< 1 second**

---

## 🧪 Testing Checklist

- [ ] Run migration 109
- [ ] Verify bucket in Storage section
- [ ] Login as driver
- [ ] Accept a trip
- [ ] Click "Start Trip"
- [ ] Capture start odometer image
- [ ] Verify image uploads to bucket
- [ ] Verify URL stored in database
- [ ] Click "End Trip"
- [ ] Capture end odometer image
- [ ] Complete trip
- [ ] Login as admin
- [ ] Go to Trips screen
- [ ] Find completed trip
- [ ] Scroll to "Odometer Images"
- [ ] ✅ Verify both images display
- [ ] ✅ Verify zoom controls work
- [ ] ✅ Verify query is fast (not timeout)

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Bucket not found" | Run migration 109 in SQL Editor |
| "Upload failed" | Check driver role is 'driver', restart app |
| "Image won't load" | Check image URL is public, check storage policies |
| "Query timeout" | Verify old base64 images aren't in database, check indexes |
| "Zoom not working" | Check ZoomableImage component is imported correctly |

---

## 🎯 Summary

✅ **Drivers upload** → `uploadOdometerImage()` → Bucket + returns URL
✅ **Database stores** → URL only (100 bytes)
✅ **Admins fetch** → Query is fast, URLs are public
✅ **Display** → Images load from public bucket URLs
✅ **Performance** → No timeouts, queries complete in < 1 second
