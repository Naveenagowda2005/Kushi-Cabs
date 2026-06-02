# Driver Verification System - API Examples

This document provides example API endpoints and implementations for the driver verification system.

## Base Setup

All examples assume:
- Supabase client initialized
- User authenticated
- Proper error handling in place

---

## 1. Upload Document

### Endpoint: POST /api/driver/documents/upload

**Request:**
```json
{
  "document_type": "DL",
  "file": "File object from form"
}
```

**Implementation (Node.js/Express):**
```javascript
app.post('/api/driver/documents/upload', async (req, res) => {
  try {
    const { document_type } = req.body;
    const file = req.files.file;
    const driver_id = req.user.id;

    // Validate document type
    const validTypes = ['DL', 'VEHICLE_FRONT', 'INSURANCE', 'FC', 'EMISSION', 'RC'];
    if (!validTypes.includes(document_type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Upload file to storage
    const fileName = `${driver_id}/${document_type}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(fileName, file.data);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(fileName);

    // Insert/update document record
    const { data, error } = await supabase
      .from('driver_documents')
      .upsert({
        driver_id,
        document_type,
        document_url: publicUrl,
        status: 'pending'
      }, {
        onConflict: 'driver_id,document_type'
      })
      .select();

    if (error) throw error;

    res.json({
      success: true,
      document: data[0],
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "driver_id": "uuid",
    "document_type": "DL",
    "document_url": "https://...",
    "status": "pending",
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 2. Get Driver's Documents

### Endpoint: GET /api/driver/documents

**Implementation:**
```javascript
app.get('/api/driver/documents', async (req, res) => {
  try {
    const driver_id = req.user.id;

    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driver_id)
      .order('document_type');

    if (error) throw error;

    res.json({
      success: true,
      documents: data,
      total: data.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "driver_id": "uuid",
      "document_type": "DL",
      "document_url": "https://...",
      "status": "approved",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "verified_at": "2024-01-15T11:00:00Z"
    },
    {
      "id": "uuid",
      "driver_id": "uuid",
      "document_type": "INSURANCE",
      "document_url": "https://...",
      "status": "pending",
      "uploaded_at": "2024-01-15T10:35:00Z"
    }
  ],
  "total": 2
}
```

---

## 3. Get Verification Status

### Endpoint: GET /api/driver/verification-status

**Implementation:**
```javascript
app.get('/api/driver/verification-status', async (req, res) => {
  try {
    const driver_id = req.user.id;

    const { data, error } = await supabase
      .from('driver_verification_status')
      .select(`
        *,
        documents:driver_documents(
          id,
          document_type,
          status,
          rejection_reason
        )
      `)
      .eq('driver_id', driver_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.json({
        success: true,
        status: 'not_started',
        message: 'No documents uploaded yet'
      });
    }

    res.json({
      success: true,
      verification: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "id": "uuid",
    "driver_id": "uuid",
    "overall_status": "pending",
    "all_documents_submitted": true,
    "submitted_at": "2024-01-15T10:40:00Z",
    "approved_at": null,
    "rejected_at": null,
    "documents": [
      {
        "id": "uuid",
        "document_type": "DL",
        "status": "approved"
      },
      {
        "id": "uuid",
        "document_type": "INSURANCE",
        "status": "pending"
      }
    ]
  }
}
```

---

## 4. Admin: Get Pending Verifications

### Endpoint: GET /api/admin/verifications/pending

**Implementation:**
```javascript
app.get('/api/admin/verifications/pending', async (req, res) => {
  try {
    // Verify admin role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', req.user.id)
      .single();

    if (userError || user.role_id !== 1) { // Assuming admin role_id = 1
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('driver_verification_status')
      .select(`
        *,
        driver:users(id, full_name, phone),
        documents:driver_documents(
          id,
          document_type,
          status,
          uploaded_at
        )
      `)
      .eq('overall_status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      pending_verifications: data,
      total: data.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**
```json
{
  "success": true,
  "pending_verifications": [
    {
      "id": "uuid",
      "driver_id": "uuid",
      "overall_status": "pending",
      "all_documents_submitted": true,
      "submitted_at": "2024-01-15T10:40:00Z",
      "driver": {
        "id": "uuid",
        "full_name": "John Doe",
        "phone": "+91-9876543210"
      },
      "documents": [
        {
          "id": "uuid",
          "document_type": "DL",
          "status": "approved",
          "uploaded_at": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "total": 1
}
```

---

## 5. Admin: Approve Document

### Endpoint: POST /api/admin/documents/:id/approve

**Request:**
```json
{
  "document_id": "uuid"
}
```

**Implementation:**
```javascript
app.post('/api/admin/documents/:id/approve', async (req, res) => {
  try {
    const document_id = req.params.id;
    const admin_id = req.user.id;

    // Verify admin role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', admin_id)
      .single();

    if (userError || user.role_id !== 1) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('driver_documents')
      .update({
        status: 'approved',
        verified_by: admin_id,
        verified_at: new Date().toISOString()
      })
      .eq('id', document_id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      document: data[0],
      message: 'Document approved successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "status": "approved",
    "verified_by": "admin-uuid",
    "verified_at": "2024-01-15T11:00:00Z"
  },
  "message": "Document approved successfully"
}
```

---

## 6. Admin: Reject Document

### Endpoint: POST /api/admin/documents/:id/reject

**Request:**
```json
{
  "rejection_reason": "Document is blurry and not readable"
}
```

**Implementation:**
```javascript
app.post('/api/admin/documents/:id/reject', async (req, res) => {
  try {
    const document_id = req.params.id;
    const admin_id = req.user.id;
    const { rejection_reason } = req.body;

    // Verify admin role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', admin_id)
      .single();

    if (userError || user.role_id !== 1) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const { data, error } = await supabase
      .from('driver_documents')
      .update({
        status: 'rejected',
        rejection_reason,
        verified_by: admin_id,
        verified_at: new Date().toISOString()
      })
      .eq('id', document_id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      document: data[0],
      message: 'Document rejected successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "status": "rejected",
    "rejection_reason": "Document is blurry and not readable",
    "verified_by": "admin-uuid",
    "verified_at": "2024-01-15T11:00:00Z"
  },
  "message": "Document rejected successfully"
}
```

---

## 7. Admin: Get Approved Drivers

### Endpoint: GET /api/admin/drivers/approved

**Implementation:**
```javascript
app.get('/api/admin/drivers/approved', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('driver_verification_status')
      .select(`
        *,
        driver:users(id, full_name, phone, email)
      `)
      .eq('overall_status', 'approved')
      .order('approved_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      approved_drivers: data,
      total: data.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 8. Admin: Get Rejected Drivers

### Endpoint: GET /api/admin/drivers/rejected

**Implementation:**
```javascript
app.get('/api/admin/drivers/rejected', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('driver_verification_status')
      .select(`
        *,
        driver:users(id, full_name, phone, email)
      `)
      .eq('overall_status', 'rejected')
      .order('rejected_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      rejected_drivers: data,
      total: data.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 9. Admin: Get Verification Dashboard Stats

### Endpoint: GET /api/admin/verifications/stats

**Implementation:**
```javascript
app.get('/api/admin/verifications/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('driver_verification_status')
      .select('overall_status');

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(d => d.overall_status === 'pending').length,
      approved: data.filter(d => d.overall_status === 'approved').length,
      rejected: data.filter(d => d.overall_status === 'rejected').length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "pending": 45,
    "approved": 100,
    "rejected": 5
  }
}
```

---

## Error Handling

All endpoints should include proper error handling:

```javascript
const handleError = (error, res) => {
  console.error('Error:', error);
  
  if (error.code === 'PGRST116') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (error.code === '42P01') {
    return res.status(500).json({ error: 'Database table not found' });
  }
  
  res.status(500).json({ 
    error: error.message || 'Internal server error' 
  });
};
```

---

## Rate Limiting

Recommended rate limits:
- Document upload: 10 requests per minute per user
- Admin verification: 100 requests per minute per admin
- Status checks: 30 requests per minute per user

---

## Caching Strategy

For better performance:
- Cache verification status for 5 minutes
- Cache document list for 2 minutes
- Cache admin dashboard stats for 1 minute
- Invalidate cache on document upload/verification

---

## Testing

Example test cases:

```javascript
describe('Driver Verification API', () => {
  it('should upload a document', async () => {
    // Test implementation
  });

  it('should get driver documents', async () => {
    // Test implementation
  });

  it('should approve a document', async () => {
    // Test implementation
  });

  it('should reject a document with reason', async () => {
    // Test implementation
  });

  it('should update overall status when all documents approved', async () => {
    // Test implementation
  });
});
```
