# Create Odometer RLS Policies via Supabase API

## Problem
Cannot create RLS policies via SQL (permission denied). Must use Supabase Dashboard UI or Management API.

## Solution: Use Supabase Management API

### Prerequisites
- Access token: Get from Supabase Account Settings
- Project ID: `cqfsirfjwfxvwggjkrvd`
- API Base URL: `https://api.supabase.com/v1`

---

## Step 1: Get Your Access Token

1. Go to: https://app.supabase.com/account/tokens
2. Create a **Personal Access Token**
3. Copy the token (save it temporarily)

---

## Step 2: Create Policies via cURL

Run these commands in Terminal/PowerShell:

### Policy 1: INSERT (Upload)

```bash
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Authenticated users can upload odometer images",
    "definition": "bucket_id = '\''odometer-images'\''",
    "bucket_id": "odometer-images",
    "action": "INSERT",
    "roles": ["authenticated"]
  }'
```

**Expected Response:**
```json
{
  "id": "policy_id_here",
  "name": "Authenticated users can upload odometer images",
  "roles": ["authenticated"],
  "action": "INSERT",
  ...
}
```

---

### Policy 2: SELECT (Public Read)

```bash
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Anyone can view odometer images",
    "definition": "bucket_id = '\''odometer-images'\''",
    "bucket_id": "odometer-images",
    "action": "SELECT",
    "roles": ["public"]
  }'
```

---

### Policy 3: SELECT (Authenticated Read)

```bash
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Authenticated users can view odometer images",
    "definition": "bucket_id = '\''odometer-images'\''",
    "bucket_id": "odometer-images",
    "action": "SELECT",
    "roles": ["authenticated"]
  }'
```

---

### Policy 4: DELETE (Own Images)

```bash
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Users can delete their own odometer images",
    "definition": "bucket_id = '\''odometer-images'\'' AND owner_id = auth.uid()",
    "bucket_id": "odometer-images",
    "action": "DELETE",
    "roles": ["authenticated"]
  }'
```

---

## Alternative: Use Supabase Dashboard (Easiest)

If API is complex, just go to Dashboard:

1. **URL**: https://app.supabase.com/
2. **Project**: Select TAXI
3. **Storage**: Click `odometer-images` bucket
4. **Policies Tab**: Create the 4 policies manually
5. Each policy should show as "Active" after creation

---

## Verify Policies Created

### Via API:
```bash
curl -X GET "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies?bucket_id=odometer-images" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Via Supabase Dashboard:
Storage → odometer-images → Policies tab → Should show 4 active policies

---

## After Policies Are Created

1. Restart backend:
   ```bash
   cd backend
   npm start
   ```

2. Restart frontend:
   ```bash
   cd apps/unified
   npm start
   ```

3. Test upload in driver app:
   - Login as driver
   - Click upload odometer
   - Select image
   - Should upload successfully ✅

---

## Troubleshooting

### If API returns 401 Unauthorized
- Access token expired or invalid
- Get new token from account settings
- Try again

### If API returns 404 Not Found
- Project ID might be wrong
- Check: `cqfsirfjwfxvwggjkrvd`
- Verify project exists in account

### If API returns 400 Bad Request
- Check JSON format is correct
- Verify bucket_id = `odometer-images` (exact spelling)
- Check all required fields present

### If Dashboard policies don't appear
- Refresh page (F5)
- Clear browser cache
- Try again

