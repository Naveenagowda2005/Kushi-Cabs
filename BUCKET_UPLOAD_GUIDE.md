# Upload Documents to Supabase Bucket

Guide to upload all .md documentation files to your Supabase storage buckets.

## Buckets Created

✅ **vendor-documents** - For vendor-related documents
✅ **user-avatars** - For user profile pictures
✅ **driver-documents** - For driver verification documents

## Setup Steps

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** (SUPABASE_URL)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY) - Keep this SECRET!

### Step 2: Set Environment Variables

Create a `.env` file in the project root or set these in your terminal:

```bash
# Windows Command Prompt
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
set BUCKET_NAME=vendor-documents

# Windows PowerShell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:BUCKET_NAME="vendor-documents"

# Linux/Mac
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export BUCKET_NAME=vendor-documents
```

### Step 3: Install Dependencies

```bash
cd newtaxi
npm install @supabase/supabase-js
```

### Step 4: Run Upload Script

```bash
node scripts/upload-documents-to-bucket.js
```

## Bucket Options

Upload to different buckets by setting BUCKET_NAME:

```bash
# Upload to vendor-documents (default)
node scripts/upload-documents-to-bucket.js

# Upload to driver-documents
set BUCKET_NAME=driver-documents
node scripts/upload-documents-to-bucket.js

# Upload to user-avatars
set BUCKET_NAME=user-avatars
node scripts/upload-documents-to-bucket.js
```

## What Gets Uploaded

The script scans the TAXI root directory and uploads all `.md` files (Markdown documents), excluding:
- `node_modules/`
- `.git/`
- `newtaxi/` subdirectory
- `.next/`, `dist/`, `build/`

## Output

The script provides a summary showing:
- ✓ Successfully uploaded files
- ✗ Failed uploads (if any)
- File sizes
- Total count

Example:
```
🚀 Starting document upload...

📁 Scanning directory: c:\Users\navee\OneDrive\Desktop\TAXI
📦 Target bucket: vendor-documents

📄 Found 45 markdown files to upload

...uploading...

📊 UPLOAD SUMMARY
============================================================
✓ Successful: 45
  - ACCEPTED_TRIP_SEAL_STAMP_5MIN_FIX.md (2,850 bytes)
  - ACTION_PLAN_FIX_VENDOR_6360306853.md (1,920 bytes)
  ...

✅ All documents uploaded successfully!
```

## Database Tracking (Optional)

If you want to track uploaded files in your database:

1. Run the migration:
```sql
-- Execute in Supabase SQL editor
-- File: newtaxi/supabase/migrations/102_create_documentation_bucket.sql
```

2. This creates a `documentation_files` table with:
   - file_name
   - storage_path
   - file_size_bytes
   - uploaded_at
   - description

## Accessing Uploaded Files

### Via Supabase Dashboard
1. Go to **Storage** → Select your bucket
2. Browse files in `docs/` folder
3. Click file to get public URL (if bucket is public)

### Via Code

```javascript
// Get public URL
const { data } = supabase.storage
  .from('vendor-documents')
  .getPublicUrl('docs/YOUR_FILE.md');

console.log(data.publicUrl);

// Download file
const { data, error } = await supabase.storage
  .from('vendor-documents')
  .download('docs/YOUR_FILE.md');

// List all files
const { data, error } = await supabase.storage
  .from('vendor-documents')
  .list('docs/');
```

## Troubleshooting

### "Missing required environment variables"
Make sure you've set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### "Some files failed to upload"
Check:
- Internet connection
- Bucket exists and is accessible
- Service role key has upload permissions
- File paths are correct

### "401 Unauthorized"
- Service role key is incorrect
- Key has been rotated - get the latest from Supabase dashboard

### "Bucket not found"
- Check bucket name spelling
- Verify bucket exists in Supabase dashboard
- Ensure it's not in a different project

## Security Notes

⚠️ **Important**: Never commit `.env` files or expose `SUPABASE_SERVICE_ROLE_KEY` in version control

The service role key has full admin access - treat it like a password!

For production:
1. Use environment variables only
2. Consider bucket policies and RLS
3. Rotate keys periodically
