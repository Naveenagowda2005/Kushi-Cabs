import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';

/**
 * Storage Service - Handle file uploads/downloads from Supabase Storage buckets
 * Replaces database storage (base64 in tables) with cloud storage
 */

// Bucket names
export const STORAGE_BUCKETS = {
  DRIVER_DOCUMENTS: 'driver-documents',
  USER_AVATARS: 'user-avatars',
  TRIP_PHOTOS: 'trip-photos',
  VEHICLE_PHOTOS: 'vehicle-photos',
};

// File size limits (in bytes)
const FILE_LIMITS = {
  DOCUMENT: 10 * 1024 * 1024, // 10 MB
  AVATAR: 5 * 1024 * 1024, // 5 MB
  PHOTO: 15 * 1024 * 1024, // 15 MB
};

// Allowed MIME types
const ALLOWED_TYPES = {
  DOCUMENT: ['image/jpeg', 'image/png', 'application/pdf'],
  AVATAR: ['image/jpeg', 'image/png', 'image/webp'],
  PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
};

/**
 * Upload a file from local URI to Supabase storage
 * @param {string} bucket - Bucket name (use STORAGE_BUCKETS)
 * @param {string} localUri - Local file URI (expo-file-system path)
 * @param {string} fileName - File name in storage (will be prefixed with user ID)
 * @param {object} options - Additional options
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadFile(bucket, localUri, fileName, options = {}) {
  try {
    const { userId = null, mimeType = 'application/octet-stream' } = options;
    
    if (!localUri) {
      throw new Error('Local URI is required');
    }

    // Get file data
    const fileData = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create storage path: bucket/user-id/timestamp_filename
    const timestamp = Date.now();
    const userPath = userId ? `${userId}/` : 'public/';
    const storagePath = `${userPath}${timestamp}_${fileName}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, decode(fileData), {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return {
      path: storagePath,
      url: urlData.publicUrl,
      bucket,
      fileName,
    };
  } catch (error) {
    console.error('❌ File upload error:', error);
    throw error;
  }
}

/**
 * Download a file from storage to local device
 * @param {string} bucket - Bucket name
 * @param {string} storagePath - Path in storage
 * @returns {Promise<string>} - Local file path
 */
export async function downloadFile(bucket, storagePath) {
  try {
    if (!storagePath) {
      throw new Error('Storage path is required');
    }

    // Create local file path
    const fileName = storagePath.split('/').pop();
    const localPath = `${FileSystem.documentDirectory}${fileName}`;

    // Download file
    const { uri } = await FileSystem.downloadAsync(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`,
      localPath,
      {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      }
    );

    return uri;
  } catch (error) {
    console.error('❌ File download error:', error);
    throw error;
  }
}

/**
 * Get a signed URL for a file (for temporary access or private files)
 * @param {string} bucket - Bucket name
 * @param {string} storagePath - Path in storage
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Signed URL
 */
export async function getSignedUrl(bucket, storagePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('❌ Get signed URL error:', error);
    throw error;
  }
}

/**
 * Get public URL for a file (works for public buckets)
 * @param {string} bucket - Bucket name
 * @param {string} storagePath - Path in storage
 * @returns {string} - Public URL
 */
export function getPublicUrl(bucket, storagePath) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Delete a file from storage
 * @param {string} bucket - Bucket name
 * @param {string} storagePath - Path in storage
 * @returns {Promise<void>}
 */
export async function deleteFile(bucket, storagePath) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log(`✅ File deleted: ${storagePath}`);
  } catch (error) {
    console.error('❌ File delete error:', error);
    throw error;
  }
}

/**
 * Upload driver document
 * @param {string} userId - User ID
 * @param {string} localUri - Local file path
 * @param {string} documentType - Type of document (DL, RC, etc)
 * @param {string} mimeType - MIME type
 * @returns {Promise<object>} - Upload result with path and URL
 */
export async function uploadDriverDocument(userId, localUri, documentType, mimeType = 'image/jpeg') {
  const fileName = `${documentType}_${Date.now()}.jpg`;
  return uploadFile(
    STORAGE_BUCKETS.DRIVER_DOCUMENTS,
    localUri,
    fileName,
    {
      userId,
      mimeType,
    }
  );
}

/**
 * Upload user avatar
 * @param {string} userId - User ID
 * @param {string} localUri - Local file path
 * @param {string} mimeType - MIME type
 * @returns {Promise<object>} - Upload result
 */
export async function uploadUserAvatar(userId, localUri, mimeType = 'image/jpeg') {
  const fileName = `avatar_${Date.now()}.jpg`;
  return uploadFile(
    STORAGE_BUCKETS.USER_AVATARS,
    localUri,
    fileName,
    {
      userId,
      mimeType,
    }
  );
}

/**
 * Upload trip photo (odometer, start/end location)
 * @param {string} userId - User ID
 * @param {string} tripId - Trip ID
 * @param {string} localUri - Local file path
 * @param {string} photoType - Type: 'odometer', 'start', 'end'
 * @param {string} mimeType - MIME type
 * @returns {Promise<object>} - Upload result
 */
export async function uploadTripPhoto(userId, tripId, localUri, photoType, mimeType = 'image/jpeg') {
  const fileName = `${tripId}_${photoType}_${Date.now()}.jpg`;
  return uploadFile(
    STORAGE_BUCKETS.TRIP_PHOTOS,
    localUri,
    fileName,
    {
      userId,
      mimeType,
    }
  );
}

/**
 * Upload vehicle photo
 * @param {string} vendorId - Vendor ID
 * @param {string} localUri - Local file path
 * @param {string} photoType - Type: 'front', 'back', 'side', 'interior'
 * @param {string} mimeType - MIME type
 * @returns {Promise<object>} - Upload result
 */
export async function uploadVehiclePhoto(vendorId, localUri, photoType, mimeType = 'image/jpeg') {
  const fileName = `${photoType}_${Date.now()}.jpg`;
  return uploadFile(
    STORAGE_BUCKETS.VEHICLE_PHOTOS,
    localUri,
    fileName,
    {
      userId: vendorId,
      mimeType,
    }
  );
}

/**
 * Migrate base64 data from database to storage (for backend)
 * This should be called from backend service
 * @param {string} bucket - Bucket name
 * @param {Array} records - Array of records with base64 data
 * @param {Function} dataExtractor - Function to extract base64 from record
 * @returns {Promise<Array>} - Migration results
 */
export async function migrateBase64ToStorage(bucket, records, dataExtractor) {
  const results = [];

  for (const record of records) {
    try {
      const base64Data = dataExtractor(record);
      if (!base64Data) continue;

      // Create temporary file
      const tempPath = `${FileSystem.cacheDirectory}temp_${record.id}.jpg`;
      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to storage
      const result = await uploadFile(
        bucket,
        tempPath,
        `migrated_${record.id}.jpg`,
        {
          userId: record.user_id,
          mimeType: 'image/jpeg',
        }
      );

      results.push({
        id: record.id,
        success: true,
        ...result,
      });

      // Clean up temp file
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
    } catch (error) {
      console.error(`❌ Migration failed for ${record.id}:`, error);
      results.push({
        id: record.id,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * List files in a directory within a bucket
 * @param {string} bucket - Bucket name
 * @param {string} directory - Directory path (optional)
 * @returns {Promise<Array>} - List of files
 */
export async function listFiles(bucket, directory = '') {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(directory);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('❌ List files error:', error);
    throw error;
  }
}

/**
 * Helper function to decode base64
 * @private
 */
function decode(str) {
  const bytes = atob(str);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return arr;
}

/**
 * Validate file before upload
 * @param {string} localUri - File path
 * @param {string} fileType - Type: 'document', 'avatar', 'photo'
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateFile(localUri, fileType = 'photo') {
  try {
    const info = await FileSystem.getInfoAsync(localUri);
    
    if (!info.exists) {
      return { valid: false, error: 'File does not exist' };
    }

    const limit = FILE_LIMITS[fileType.toUpperCase()] || FILE_LIMITS.PHOTO;
    
    if (info.size > limit) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${limit / (1024 * 1024)}MB`,
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export default {
  uploadFile,
  downloadFile,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
  uploadDriverDocument,
  uploadUserAvatar,
  uploadTripPhoto,
  uploadVehiclePhoto,
  migrateBase64ToStorage,
  listFiles,
  validateFile,
  STORAGE_BUCKETS,
};
