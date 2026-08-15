/**
 * Backend Upload Fallback
 * If client-side uploads fail due to RLS, use a backend API endpoint
 * This uses the service role key which bypasses RLS
 */

import { API_CONFIG } from '../constants';

/**
 * Upload document via backend API (uses service role key to bypass RLS)
 * @param {string} driverId - Driver ID
 * @param {string} documentType - Document type
 * @param {object} imageData - Image data with base64
 * @returns {Promise<string>} - Storage URL
 */
export const uploadDocumentViaBackend = async (driverId, documentType, imageData) => {
  try {
    console.log('📤 Uploading via backend API...');

    const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/api/upload-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driverId,
        documentType,
        base64Data: imageData.base64,
        fileName: imageData.fileName,
        mimeType: imageData.type || 'image/jpeg',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Backend upload failed');
    }

    const result = await response.json();
    console.log('✅ Backend upload successful:', result.url);
    return result.url;
  } catch (error) {
    console.error('❌ Backend upload error:', error.message);
    throw error;
  }
};
