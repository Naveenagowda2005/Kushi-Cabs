/**
 * Storage Migration Routes
 * Migrate base64 data from database to Supabase Storage buckets
 * 
 * This endpoint should only be accessible to super admins
 * Run this ONCE to migrate all existing data
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

/**
 * Middleware: Allow migration (no auth check - local dev only)
 */
const requireSuperAdmin = async (req, res, next) => {
  console.log('🔑 Migration endpoint accessed');
  next();
};

/**
 * POST /api/storage-migration/migrate-documents
 * Migrate driver documents from base64 to storage
 */
router.post('/migrate-documents', requireSuperAdmin, async (req, res) => {
  try {
    console.log('🔄 Starting driver documents migration...');

    // Fetch all driver documents with base64 data
    const { data: documents, error } = await supabase
      .from('driver_documents')
      .select('id, user_id, document_type, document_data, document_name, document_mime_type')
      .not('document_data', 'is', null);

    if (error) throw error;

    if (!documents || documents.length === 0) {
      return res.json({ message: 'No documents to migrate' });
    }

    console.log(`📄 Found ${documents.length} documents to migrate`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const doc of documents) {
      try {
        // Skip if already migrated (has storage_path)
        if (doc.storage_path) {
          console.log(`⏭️  Skipping ${doc.id} - already migrated`);
          continue;
        }

        if (!doc.document_data) {
          console.log(`⏭️  Skipping ${doc.id} - no data`);
          continue;
        }

        // Decode base64 data
        const buffer = Buffer.from(doc.document_data, 'base64');
        const fileName = `${doc.document_type}_${doc.id}.jpg`;
        const storagePath = `${doc.user_id}/${fileName}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('driver-documents')
          .upload(storagePath, buffer, {
            contentType: doc.document_mime_type || 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Update database record with storage path
        const { error: updateError } = await supabase
          .from('driver_documents')
          .update({
            storage_path: storagePath,
            // Optionally: Clear base64 data to save space (uncomment if needed)
            // document_data: null,
          })
          .eq('id', doc.id);

        if (updateError) throw updateError;

        console.log(`✅ Migrated: ${doc.id}`);
        results.push({
          id: doc.id,
          status: 'success',
          storagePath,
        });
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate ${doc.id}:`, error.message);
        results.push({
          id: doc.id,
          status: 'failed',
          error: error.message,
        });
        failCount++;
      }
    }

    res.json({
      message: 'Documents migration completed',
      total: documents.length,
      success: successCount,
      failed: failCount,
      results: results.slice(0, 10), // Return first 10 results
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/storage-migration/migrate-avatars
 * Migrate user avatars from base64 to storage
 */
router.post('/migrate-avatars', requireSuperAdmin, async (req, res) => {
  try {
    console.log('🔄 Starting user avatars migration...');

    // Fetch all users with avatar data
    const { data: users, error } = await supabase
      .from('users')
      .select('id, avatar_base64')
      .not('avatar_base64', 'is', null);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.json({ message: 'No avatars to migrate' });
    }

    console.log(`👤 Found ${users.length} avatars to migrate`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        // Skip if already migrated (has avatar_storage_path)
        if (user.avatar_storage_path) {
          console.log(`⏭️  Skipping ${user.id} - already migrated`);
          continue;
        }

        if (!user.avatar_base64) {
          continue;
        }

        // Decode base64 data
        const buffer = Buffer.from(user.avatar_base64, 'base64');
        const fileName = `avatar_${user.id}.jpg`;
        const storagePath = `${user.id}/${fileName}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(storagePath, buffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Update database record
        const { error: updateError } = await supabase
          .from('users')
          .update({
            avatar_storage_path: storagePath,
            // Optionally: Clear base64 data to save space
            // avatar_base64: null,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        console.log(`✅ Migrated avatar: ${user.id}`);
        results.push({
          id: user.id,
          status: 'success',
          storagePath,
        });
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate avatar for ${user.id}:`, error.message);
        results.push({
          id: user.id,
          status: 'failed',
          error: error.message,
        });
        failCount++;
      }
    }

    res.json({
      message: 'Avatars migration completed',
      total: users.length,
      success: successCount,
      failed: failCount,
      results: results.slice(0, 10),
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/storage-migration/clear-base64
 * DANGEROUS: Clear base64 data after successful migration
 * Only run after verifying all files are in storage buckets
 */
router.post('/clear-base64', requireSuperAdmin, async (req, res) => {
  try {
    const { tableType } = req.body; // 'documents' or 'avatars'

    if (!tableType || !['documents', 'avatars'].includes(tableType)) {
      return res.status(400).json({ error: 'Invalid tableType' });
    }

    let result;

    if (tableType === 'documents') {
      console.log('🗑️  Clearing base64 data from driver_documents...');
      result = await supabase
        .from('driver_documents')
        .update({ document_data: null })
        .not('storage_path', 'is', null);
    } else {
      console.log('🗑️  Clearing base64 data from users avatars...');
      result = await supabase
        .from('users')
        .update({ avatar_base64: null })
        .not('avatar_storage_path', 'is', null);
    }

    if (result.error) throw result.error;

    res.json({
      message: `Cleared base64 data for ${tableType}`,
      rowsAffected: result.count,
    });
  } catch (error) {
    console.error('❌ Clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/storage-migration/status
 * Check migration status
 */
router.get('/status', requireSuperAdmin, async (req, res) => {
  try {
    // Check documents
    const { data: docsWithStorage } = await supabase
      .from('driver_documents')
      .select('id', { count: 'exact' })
      .not('storage_path', 'is', null);

    const { data: docsWithBase64 } = await supabase
      .from('driver_documents')
      .select('id', { count: 'exact' })
      .not('document_data', 'is', null);

    // Check avatars
    const { data: avatarsWithStorage } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .not('avatar_storage_path', 'is', null);

    const { data: avatarsWithBase64 } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .not('avatar_base64', 'is', null);

    res.json({
      documents: {
        migratedToStorage: docsWithStorage?.length || 0,
        stillInBase64: docsWithBase64?.length || 0,
      },
      avatars: {
        migratedToStorage: avatarsWithStorage?.length || 0,
        stillInBase64: avatarsWithBase64?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
