#!/usr/bin/env node

/**
 * Upload Documentation Script
 * Uploads all .md files from TAXI root directory to Supabase storage bucket
 * 
 * Prerequisites:
 * 1. Create buckets in Supabase Dashboard (vendor-documents, user-avatars, driver-documents)
 * 2. Set environment variables:
 *    - SUPABASE_URL: Your Supabase project URL
 *    - SUPABASE_SERVICE_ROLE_KEY: Service role key (has admin access)
 *    - BUCKET_NAME: Target bucket (default: vendor-documents)
 * 3. Run migration 102_create_documentation_bucket.sql first
 * 
 * Usage:
 * node scripts/upload-documents-to-bucket.js
 * 
 * Or specify bucket:
 * BUCKET_NAME=driver-documents node scripts/upload-documents-to-bucket.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME || 'vendor-documents'; // Use vendor-documents by default
const DOCS_DIR = path.join(__dirname, '../../'); // TAXI root directory
const EXCLUDE_DIRS = ['node_modules', '.git', 'newtaxi', '.next', 'dist', 'build'];

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Find all .md files in directory
 */
function findMarkdownFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      // Skip excluded directories and hidden files
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(file) && !file.startsWith('.')) {
          findMarkdownFiles(filePath, fileList);
        }
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return fileList;
}

/**
 * Upload a single file to Supabase storage
 */
async function uploadFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const fileSize = fileContent.length;
    
    // Create storage path: docs/filename
    const storagePath = `docs/${fileName}`;

    console.log(`Uploading: ${fileName} (${fileSize} bytes)...`);

    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileContent, {
        contentType: 'text/markdown',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log(`✓ Uploaded: ${fileName}`);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    // Insert record into documentation_files table
    const { error: dbError } = await supabase
      .from('documentation_files')
      .upsert({
        file_name: fileName,
        file_path: filePath,
        storage_path: storagePath,
        file_size_bytes: fileSize,
        mime_type: 'text/markdown',
      }, {
        onConflict: 'file_name',
      });

    if (dbError) {
      console.warn(`⚠ Uploaded to storage but DB record failed for ${fileName}:`, dbError.message);
    } else {
      console.log(`✓ Database record created for ${fileName}`);
    }

    return {
      success: true,
      fileName,
      fileSize,
      storagePath,
      publicUrl: publicUrlData?.publicUrl,
    };
  } catch (error) {
    console.error(`✗ Failed to upload ${path.basename(filePath)}:`, error.message);
    return {
      success: false,
      fileName: path.basename(filePath),
      error: error.message,
    };
  }
}

/**
 * Main upload function
 */
async function uploadAllDocuments() {
  console.log('🚀 Starting document upload...\n');
  console.log(`📁 Scanning directory: ${DOCS_DIR}`);
  console.log(`📦 Target bucket: ${BUCKET_NAME}\n`);

  // Find all markdown files
  const mdFiles = findMarkdownFiles(DOCS_DIR);

  if (mdFiles.length === 0) {
    console.log('ℹ No markdown files found to upload.');
    return;
  }

  console.log(`📄 Found ${mdFiles.length} markdown files to upload\n`);

  // Upload each file
  const results = [];
  for (const filePath of mdFiles) {
    const result = await uploadFile(filePath);
    results.push(result);
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✓ Successful: ${successful.length}`);
  successful.forEach((r) => {
    console.log(`  - ${r.fileName} (${r.fileSize} bytes)`);
  });

  if (failed.length > 0) {
    console.log(`\n✗ Failed: ${failed.length}`);
    failed.forEach((r) => {
      console.log(`  - ${r.fileName}: ${r.error}`);
    });
  }

  console.log(`\n📈 Total: ${mdFiles.length} files`);
  console.log('='.repeat(60) + '\n');

  // Return exit code based on failures
  if (failed.length > 0) {
    console.log('⚠ Some files failed to upload. Check errors above.');
    process.exit(1);
  } else {
    console.log('✅ All documents uploaded successfully!');
    process.exit(0);
  }
}

// Run the script
uploadAllDocuments().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
