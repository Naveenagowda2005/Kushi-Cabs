/**
 * Document Upload Routes
 * Handles uploading documents to Supabase storage using service role key
 * This bypasses client-side RLS restrictions
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase with service role key (has admin privileges)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`📋 Document Upload Route Init:`);
console.log(`   SUPABASE_URL: ${supabaseUrl ? `✓ (${supabaseUrl.substring(0, 30)}...)` : '✗ undefined'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? `✓ (${supabaseServiceKey.substring(0, 20)}...)` : '✗ undefined'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials for document upload');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * POST /api/upload-document
 * Upload a document to storage bucket (uses service role key)
 */
router.post('/upload-document', async (req, res) => {
  try {
    const { driverId, documentType, base64Data, fileName, mimeType } = req.body;

    console.log(`📤 Backend upload request: ${documentType} for driver: ${driverId}`);

    // Validate input
    if (!driverId || !documentType || !base64Data) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['driverId', 'documentType', 'base64Data']
      });
    }

    if (base64Data.length === 0) {
      return res.status(400).json({ error: 'Image data is empty' });
    }

    if (base64Data.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max 10MB)' });
    }

    // Decode base64 to binary
    let uploadData = base64Data;
    
    // If base64 includes data URI prefix, remove it
    if (uploadData.includes(',')) {
      uploadData = uploadData.split(',')[1];
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(uploadData, 'base64');

    // Use consistent filename so re-uploads replace the old file (no duplicates)
    const fileExt = fileName ? fileName.split('.').pop() : 'jpg';
    const storagePath = `drivers/${driverId}/${documentType}.${fileExt}`;

    console.log(`📤 Uploading to: driver-documents/${storagePath}`);

    // Upload to storage bucket using service role key with upsert: true to replace old files
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .upload(storagePath, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.error('❌ Storage upload error:', error.message);
      return res.status(500).json({
        error: 'Upload failed',
        message: error.message
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(storagePath);

    console.log(`✅ Document uploaded: ${publicUrlData.publicUrl}`);

    res.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: storagePath,
      documentType,
      driverId
    });

  } catch (error) {
    console.error('❌ Document upload error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

/**
 * POST /api/upload-avatar
 * Upload a user avatar to storage bucket
 */
router.post('/upload-avatar', async (req, res) => {
  try {
    const { userId, base64Data, fileName, mimeType } = req.body;

    console.log(`📤 Avatar upload request for user: ${userId}`);

    if (!userId || !base64Data) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'base64Data']
      });
    }

    let uploadData = base64Data;
    if (uploadData.includes(',')) {
      uploadData = uploadData.split(',')[1];
    }

    const buffer = Buffer.from(uploadData, 'base64');
    const timestamp = Date.now();
    const storagePath = `${userId}/avatar_${timestamp}.jpg`;

    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(storagePath, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.error('❌ Avatar upload error:', error.message);
      return res.status(500).json({
        error: 'Upload failed',
        message: error.message
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(storagePath);

    console.log(`✅ Avatar uploaded: ${publicUrlData.publicUrl}`);

    res.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: storagePath,
      userId
    });

  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

/**
 * POST /api/upload/odometer
 * Upload odometer image via backend (bypasses client RLS - uses service role key)
 */
router.post('/odometer', async (req, res) => {
  try {
    const { tripId, type, base64Data, mimeType } = req.body;

    if (!tripId || !type || !base64Data) {
      return res.status(400).json({ error: 'Missing required fields: tripId, type, base64Data' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Backend not configured' });
    }

    let uploadData = base64Data;
    if (uploadData.includes(',')) {
      uploadData = uploadData.split(',')[1];
    }

    const buffer = Buffer.from(uploadData, 'base64');
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const fileName = `${tripId}/${type}_${Date.now()}.${ext}`;

    console.log(`📤 Odometer upload: ${fileName}`);

    const { error } = await supabase.storage
      .from('odometer-images')
      .upload(fileName, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('❌ Odometer upload error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from('odometer-images')
      .getPublicUrl(fileName);

    console.log(`✅ Odometer uploaded: ${publicUrlData.publicUrl}`);
    res.json({ success: true, url: publicUrlData.publicUrl });

  } catch (error) {
    console.error('❌ Odometer upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/list-documents/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return res.status(400).json({
        error: 'Missing driverId',
        required: ['driverId']
      });
    }

    console.log(`📋 Listing documents for driver: ${driverId}`);

    // Check if supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({
        error: 'Backend not configured',
        message: 'Supabase credentials missing'
      });
    }

    // Step 1: List files from driver's folder using service role key (no RLS restrictions)
    const { data: files, error } = await supabase.storage
      .from('driver-documents')
      .list(`drivers/${driverId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('❌ Error listing documents:', error.message);
      return res.status(500).json({
        error: 'Failed to list documents',
        message: error.message
      });
    }

    console.log(`✅ Found ${files?.length || 0} files for driver ${driverId}`);

    // Step 2: Get document statuses from database
    const { data: dbDocuments, error: dbError } = await supabase
      .from('driver_documents')
      .select('document_type, status, uploaded_at, rejection_reason')
      .eq('driver_id', driverId);

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('❌ Error fetching from database:', dbError.message);
    }

    // Create a map of document types to their database info
    const dbDocMap = {};
    if (dbDocuments && Array.isArray(dbDocuments)) {
      dbDocuments.forEach(doc => {
        dbDocMap[doc.document_type] = doc;
      });
    }

    console.log('📝 Database documents:', Object.keys(dbDocMap));

    // Step 3: Filter out directories and hidden files, then map with database info
    let documents = (files || [])
      .filter(file => {
        // Skip directories (they don't have 'id' field or have id=null)
        // Only process actual files
        if (!file.id || file.id === null) {
          return false;
        }
        // Skip hidden files
        if (file.name.startsWith('.')) {
          return false;
        }
        return true;
      })
      .map(file => {
        // Extract document type from filename (DL.jpg -> DL)
        const documentType = file.name.split('.')[0];
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('driver-documents')
          .getPublicUrl(`drivers/${driverId}/${file.name}`);

        // Get status from database, fallback to 'pending' if not found
        const dbInfo = dbDocMap[documentType];
        const status = dbInfo?.status || 'pending';

        console.log(`  - ${documentType}: ${publicUrlData.publicUrl} (status: ${status})`);

        return {
          document_type: documentType,
          document_url: publicUrlData.publicUrl,
          file_name: file.name,
          uploaded_at: dbInfo?.uploaded_at || file.created_at,
          status: status,
          rejection_reason: dbInfo?.rejection_reason || null
        };
      });

    // If no files in storage but database has documents, include database documents
    if (documents.length === 0 && Object.keys(dbDocMap).length > 0) {
      console.log('⚠️  No files in storage, including documents from database');
      const documentTypesInStorage = new Set(documents.map(d => d.document_type));
      
      // Add database documents that aren't in storage
      for (const [documentType, dbInfo] of Object.entries(dbDocMap)) {
        if (!documentTypesInStorage.has(documentType)) {
          console.log(`  - ${documentType}: from database (status: ${dbInfo.status})`);
          documents.push({
            document_type: documentType,
            document_url: null,  // No URL in storage, but document exists in database
            file_name: `${documentType}.jpg`,
            uploaded_at: dbInfo.uploaded_at || null,
            status: dbInfo.status,
            rejection_reason: dbInfo.rejection_reason || null
          });
        }
      }
    }

    console.log(`✅ Mapped ${documents.length} documents with database status`);

    res.json({
      success: true,
      driverId,
      documents,
      count: documents.length
    });

  } catch (error) {
    console.error('❌ Error in list-documents:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

/**
 * GET /api/upload/list-vendor-documents/:userId
 * List vendor documents from database (vendor_documents table)
 * Returns array of documents with all metadata and URLs
 */
router.get('/list-vendor-documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId',
        required: ['userId']
      });
    }

    console.log(`📋 Listing vendor documents for user: ${userId}`);

    // Check if supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({
        error: 'Backend not configured',
        message: 'Supabase credentials missing'
      });
    }

    // Fetch vendor_documents record from database
    const { data: vendorDocsRecord, error: dbError } = await supabase
      .from('vendor_documents')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('❌ Error fetching vendor documents from database:', dbError.message);
      return res.status(500).json({
        error: 'Failed to fetch documents',
        message: dbError.message
      });
    }

    // No record found - return empty array
    if (!vendorDocsRecord) {
      console.log(`⚠️ No vendor_documents record found for user: ${userId}`);
      return res.json({
        success: true,
        userId,
        documents: [],
        count: 0
      });
    }

    // Extract documents object from database
    const dbDocuments = vendorDocsRecord.documents || {};
    console.log('📝 Database vendor documents keys:', Object.keys(dbDocuments));

    // Transform database documents to array format
    const documents = Object.entries(dbDocuments).map(([documentType, docInfo]) => {
      console.log(`  - ${documentType}: status=${docInfo?.status}, has_url=${!!docInfo?.document_url}, has_data=${!!docInfo?.document_data}`);

      return {
        document_type: documentType,
        document_url: docInfo?.document_url || null,
        document_data: docInfo?.document_data || null,  // Include base64 data
        status: docInfo?.status || 'pending',
        uploaded_at: docInfo?.uploaded_at || null,
        rejection_reason: docInfo?.rejection_reason || null,
        storage_path: docInfo?.storage_path || null,
      };
    });

    console.log(`✅ Mapped ${documents.length} vendor documents from database`);

    res.json({
      success: true,
      userId,
      documents,
      count: documents.length
    });

  } catch (error) {
    console.error('❌ Error in list-vendor-documents:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router;
