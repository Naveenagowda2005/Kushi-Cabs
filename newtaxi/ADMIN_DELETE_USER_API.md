# Admin Delete User API

## Overview

Super admin can now delete drivers and vendors. When deleted, the user is removed from **both**:
- ✅ Supabase Auth (authentication system)
- ✅ Database (user profile and all related records)

---

## Setup (3 Steps)

### Step 1: Get Supabase Credentials

Go to **Supabase Dashboard**:
1. Click: **Settings** (gear icon)
2. Click: **API** (left sidebar)
3. Copy these:
   - **Project URL**: `https://xxx.supabase.co`
   - **Service Role Secret**: (scroll down, copy the key)

### Step 2: Update Backend .env

Edit: `backend/.env`

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...
```

(Replace with your actual values from Step 1)

### Step 3: Install Dependencies

In backend directory:

```bash
npm install
```

This installs `@supabase/supabase-js` package.

---

## Restart Backend

```bash
npm run start
```

Or if using nodemon:

```bash
npm run dev
```

You should see:
```
Taxi SMS backend listening on http://0.0.0.0:4000
```

---

## API Endpoints

### 1. DELETE USER

**Endpoint**: `POST /admin/delete-user`

**Request Body**:
```json
{
  "userId": "75f834a1-4251-4630-b70e-df40d36ec781",
  "email": "9686314982@kushicabs.phone"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "deleted": {
    "auth": true,
    "database": true,
    "related": {
      "documents": true,
      "verification": true,
      "vendor": false,
      "driver": true
    }
  }
}
```

**Response (Error)**:
```json
{
  "error": "Failed to delete user",
  "message": "error details here"
}
```

---

### 2. GET USER INFO

**Endpoint**: `GET /admin/user/:userId`

**Example**: `GET http://192.168.1.114:4000/admin/user/75f834a1-4251-4630-b70e-df40d36ec781`

**Response**:
```json
{
  "id": "75f834a1-4251-4630-b70e-df40d36ec781",
  "email": "9686314982@kushicabs.phone",
  "phone": "9686314982",
  "full_name": "John Doe",
  "role_id": 3,
  "roles": {
    "name": "driver"
  },
  "is_active": true,
  "created_at": "2026-06-02T08:00:00.000Z"
}
```

---

## What Gets Deleted

When a user is deleted:

1. **Supabase Auth** - Auth user account
2. **users table** - User profile
3. **driver_documents** - All uploaded documents (for drivers)
4. **driver_verification_status** - Verification records (for drivers)
5. **drivers table** - Driver profile (for drivers)
6. **vendors table** - Vendor profile (for vendors)

---

## Frontend Integration

In the admin dashboard, you would call this from the app:

```javascript
async function deleteUser(userId, email) {
  try {
    const response = await fetch('http://192.168.1.114:4000/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        email: email
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('User deleted successfully');
      // Refresh the admin dashboard
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('Delete user error:', error);
    alert('Failed to delete user');
  }
}
```

---

## Testing with curl

### Delete a user:
```bash
curl -X POST http://192.168.1.114:4000/admin/delete-user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "75f834a1-4251-4630-b70e-df40d36ec781",
    "email": "9686314982@kushicabs.phone"
  }'
```

### Get user info:
```bash
curl http://192.168.1.114:4000/admin/user/75f834a1-4251-4630-b70e-df40d36ec781
```

---

## Troubleshooting

### Error: "Supabase admin credentials not configured"

**Fix**: Check that .env has both:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

And the backend is restarted after changes.

### Error: "User not found"

Possible causes:
- User ID is wrong
- User already deleted
- Check user exists in database first with GET endpoint

### Error: "Auth user not found or already deleted"

This is fine! It means:
- User exists in database but not in Auth
- Or user was already deleted from Auth
- Database deletion still proceeds

---

## Security Notes

⚠️ **Important**: This API should have authentication!

Currently it has no auth check. In production, add:

```javascript
// Check super admin role before allowing delete
router.post('/delete-user', (req, res) => {
  const userId = req.body.adminId; // Add this
  
  // Verify user is super_admin
  // Then allow deletion
});
```

---

## Files Modified

1. **backend/.env** - Added Supabase credentials
2. **backend/package.json** - Added @supabase/supabase-js
3. **backend/index.js** - Added admin router
4. **backend/routes/admin.js** - New file with delete endpoints

---

## Success Criteria

✅ Backend running on port 4000
✅ Supabase credentials in .env
✅ Dependencies installed (`npm install`)
✅ Can call `/admin/delete-user` endpoint
✅ User deleted from Auth and Database
✅ Related records cleaned up

---

## Next Steps

1. ✅ Setup Supabase credentials in .env
2. ✅ Run `npm install` in backend
3. ✅ Restart backend (`npm run start`)
4. ✅ Add delete button in admin dashboard UI
5. ✅ Call API when admin clicks delete

Done! 🎉
