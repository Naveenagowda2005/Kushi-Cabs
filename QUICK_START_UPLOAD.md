# Quick Start: Upload Documents to Supabase

## 1. Get Your Credentials

Go to: **Supabase Dashboard** → **Settings** → **API**

Copy these two values:
- **Project URL** → Your `SUPABASE_URL`
- **Service Role Key** → Your `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Install Dependencies

Open terminal/cmd in the `newtaxi` folder and run:

```bash
npm install @supabase/supabase-js
```

---

## 3. Set Environment Variables (Windows)

### Option A: Command Prompt (cmd)
```cmd
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
set BUCKET_NAME=vendor-documents
```

### Option B: PowerShell
```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
$env:BUCKET_NAME = "vendor-documents"
```

---

## 4. Run Upload Script

### Using PowerShell (Recommended for Windows)
```powershell
.\scripts\upload-documents.ps1
```

Or specify a different bucket:
```powershell
.\scripts\upload-documents.ps1 -Bucket driver-documents
.\scripts\upload-documents.ps1 -Bucket user-avatars
```

### Using Node.js directly
```bash
node scripts/upload-documents-to-bucket.js
```

---

## 5. Result

The script will show:
```
✓ Successful: 45 files uploaded
✗ Failed: 0 files
📈 Total: 45 files
✅ All documents uploaded successfully!
```

---

## Available Buckets

- `vendor-documents` ← **Default**, best for documentation
- `driver-documents` 
- `user-avatars`

---

## Troubleshooting

**"Missing environment variables"**
→ Make sure you ran step 3 above

**"401 Unauthorized"**
→ Check your Service Role Key is correct (it's like a password)

**"Bucket not found"**
→ Check bucket name matches exactly (case-sensitive)

---

## View Uploaded Files

1. Go to Supabase Dashboard
2. Click **Storage** in left menu
3. Select your bucket
4. Files will be in `docs/` folder

---

## Next Steps

Once uploaded, you can:
- Access files via Supabase API
- Share public URLs (if bucket is public)
- Set up policies and permissions
- Build a documentation viewer

For more details, see: `BUCKET_UPLOAD_GUIDE.md`
