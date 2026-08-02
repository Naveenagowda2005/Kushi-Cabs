import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

/**
 * Pick an image from camera or gallery
 * @param {boolean} useCamera - true for camera, false for gallery
 * @returns {Promise<{uri: string, base64: string, fileName: string}>}
 */
export const pickDocumentImage = async (useCamera = false) => {
  try {
    const options = {
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: false,
      base64: true,
    };

    let result;
    if (useCamera) {
      console.log('pickDocumentImage: Requesting camera permission');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Camera permission denied');
      }
      console.log('pickDocumentImage: Launching camera');
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      console.log('pickDocumentImage: Requesting media library permission');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Gallery permission denied');
      }
      console.log('pickDocumentImage: Launching image library');
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    console.log('pickDocumentImage: User action result - canceled:', result.canceled);

    if (result.canceled) {
      console.log('pickDocumentImage: User cancelled');
      return null;
    }

    if (!result.assets || result.assets.length === 0) {
      throw new Error('No image selected');
    }

    const asset = result.assets[0];
    console.log('pickDocumentImage: Asset received - has base64:', !!asset.base64, 'uri:', asset.uri);

    // If base64 is not available from the picker, we need to handle this gracefully
    if (!asset.base64) {
      console.warn('pickDocumentImage: Base64 not returned by ImagePicker, this may cause issues');
      // For now throw an error so we know this is happening
      throw new Error('Failed to capture image data. Please try again.');
    }

    const imageData = {
      uri: asset.uri,
      base64: asset.base64,
      type: asset.type || 'image/jpeg',
      fileName: asset.fileName || `document_${Date.now()}.jpg`,
    };

    console.log('pickDocumentImage: Returning image data - base64 length:', imageData.base64.length);

    return imageData;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Upload document image to storage bucket AND create database record
 * @param {string} driverId - Driver ID
 * @param {string} documentType - Document type (DL, VEHICLE_FRONT, etc.)
 * @param {object} imageData - Image data from pickDocumentImage
 * @returns {Promise<string>} - Storage URL of uploaded document
 */
export const uploadDocumentImage = async (driverId, documentType, imageData) => {
  try {
    if (!imageData || !imageData.base64) {
      throw new Error('Invalid image data - no base64 content');
    }

    console.log('📤 Uploading document:', documentType, 'for driver:', driverId);

    // Check if base64 is valid and not too large
    if (imageData.base64.length === 0) {
      throw new Error('Image data is empty');
    }

    if (imageData.base64.length > 10 * 1024 * 1024) {
      throw new Error('Image too large (max 10MB)');
    }

    console.log('📤 Using backend API for upload (service role key supports upsert)');

    // Always use backend API with service role key for reliable upsert behavior
    const backendUrl = process.env.EXPO_PUBLIC_SMS_API_URL || 'http://192.168.1.114:4000';
    
    const response = await fetch(`${backendUrl}/api/upload/upload-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driverId,
        documentType,
        base64Data: imageData.base64,
        fileName: imageData.fileName,
        mimeType: 'image/jpeg',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Uploaded via Backend API:', result.url);

    // NOW create database record for tracking
    console.log('📝 Creating database record for document tracking');
    const { data: existingDoc, error: checkError } = await supabase
      .from('driver_documents')
      .select('id')
      .eq('driver_id', driverId)
      .eq('document_type', documentType)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing document:', checkError);
      // Continue anyway - the file is uploaded
    }

    if (existingDoc) {
      // Update existing record
      console.log('📝 Updating existing document record');
      const { error: updateError } = await supabase
        .from('driver_documents')
        .update({
          status: 'pending',
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('driver_id', driverId)
        .eq('document_type', documentType);

      if (updateError) {
        console.error('Error updating document record:', updateError);
        // Don't throw - file is already uploaded
      }
    } else {
      // Create new record
      console.log('📝 Creating new document record');
      const { error: insertError } = await supabase
        .from('driver_documents')
        .insert([{
          driver_id: driverId,
          document_type: documentType,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
        }]);

      if (insertError) {
        console.error('Error creating document record:', insertError);
        // Don't throw - file is already uploaded, just couldn't track it
      }
    }

    console.log('✅ Successfully uploaded', documentType, 'to storage bucket and created database record');

    // Return storage URL
    return result.url;
  } catch (error) {
    console.error('❌ Error uploading document:', error.message);
    throw new Error(`Failed to upload ${documentType}: ${error.message}`);
  }
};

/**
 * Get driver's document records
 * @param {string} driverId - Driver ID
 * @returns {Promise<object>} - Driver documents record
 */
export const getDriverDocuments = async (driverId) => {
  try {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting driver documents:', error);
    throw error;
  }
};

/**
 * Create or update driver documents
 * @param {string} driverId - Driver ID
 * @param {object} documentData - Document data to update
 * @returns {Promise<object>} - Updated document record
 */
export const updateDriverDocuments = async (driverId, documentData) => {
  try {
    // First check if record exists
    const existing = await getDriverDocuments(driverId);

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('driver_documents')
        .update(documentData)
        .eq('driver_id', driverId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('driver_documents')
        .insert([{ driver_id: driverId, ...documentData }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  } catch (error) {
    console.error('Error updating driver documents:', error);
    throw error;
  }
};

/**
 * Submit documents for verification
 * @param {string} driverId - Driver ID
 * @returns {Promise<void>}
 */
export const submitDocumentsForVerification = async (driverId) => {
  try {
    console.log('submitDocumentsForVerification: Starting for driver:', driverId);

    // Update all individual document statuses to 'pending_review'
    const { error: docsUpdateError } = await supabase
      .from('driver_documents')
      .update({ status: 'pending_review', updated_at: new Date().toISOString() })
      .eq('driver_id', driverId)
      .eq('status', 'pending'); // Only update ones still in 'pending' state

    if (docsUpdateError) {
      console.error('submitDocumentsForVerification: Error updating document statuses:', docsUpdateError);
      // Don't throw - continue to update overall status
    } else {
      console.log('submitDocumentsForVerification: Individual document statuses updated to pending_review');
    }

    // Update verification status record with overall_status = 'pending_review'
    const { error: upsertError } = await supabase
      .from('driver_verification_status')
      .upsert({
        driver_id: driverId,
        all_documents_submitted: true,
        submitted_at: new Date().toISOString(),
        overall_status: 'pending_review',  // ✅ SET STATUS TO PENDING REVIEW
      }, {
        onConflict: 'driver_id'
      });

    if (upsertError) {
      console.error('submitDocumentsForVerification: Upsert error:', upsertError);
      throw upsertError;
    }

    console.log('submitDocumentsForVerification: Verification status updated to pending_review');

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('driver_verification_status')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (verifyError) {
      console.error('submitDocumentsForVerification: Verify error:', verifyError);
    } else {
      console.log('submitDocumentsForVerification: Verified status:', verifyData);
    }
  } catch (error) {
    console.error('Error submitting documents:', error);
    throw error;
  }
};

/**
 * Get all pending verifications (admin only)
 * @returns {Promise<array>} - Array of pending verifications
 */
export const getPendingVerifications = async () => {
  try {
    console.log('getPendingVerifications: Loading pending verifications');
    
    // Get documents that are PENDING or PENDING_REVIEW (not approved/rejected)
    const { data: docRecords, error: docsError } = await supabase
      .from('driver_documents')
      .select('driver_id')
      .in('status', ['pending', 'pending_review']);

    if (docsError) {
      console.error('getPendingVerifications: Error fetching pending documents:', docsError);
      throw docsError;
    }

    // Get unique driver IDs that have pending documents
    const uniqueDriverIds = [...new Set((docRecords || []).map(d => d.driver_id))];
    console.log('getPendingVerifications: Found', uniqueDriverIds.length, 'drivers with pending documents');

    if (uniqueDriverIds.length === 0) {
      console.log('getPendingVerifications: No drivers with pending documents');
      return [];
    }

    // Get verification status for these drivers
    const { data, error } = await supabase
      .from('driver_verification_status')
      .select('*')
      .in('driver_id', uniqueDriverIds);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows, which is fine
      console.error('getPendingVerifications: Query error:', error);
      throw error;
    }

    const verifiedDrivers = data || [];
    console.log('getPendingVerifications: Retrieved', verifiedDrivers.length, 'verification status records');

    // For drivers without verification status, create temporary records
    const driversWithoutStatus = uniqueDriverIds.filter(
      driverId => !verifiedDrivers.find(v => v.driver_id === driverId)
    );

    if (driversWithoutStatus.length > 0) {
      console.log('getPendingVerifications: Creating temporary records for', driversWithoutStatus.length, 'drivers without status');
      const tempRecords = driversWithoutStatus.map(driverId => ({
        driver_id: driverId,
        overall_status: 'pending_review',
        all_documents_submitted: true,
      }));
      return [...verifiedDrivers, ...tempRecords];
    }

    return verifiedDrivers;
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    throw error;
  }
};

/**
 * Get driver's verification status
 * @param {string} driverId - Driver ID
 * @returns {Promise<object>} - Verification status record
 */
export const getDriverVerificationStatus = async (driverId) => {
  try {
    const { data, error } = await supabase
      .from('driver_verification_status')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting verification status:', error);
    throw error;
  }
};

/**
 * Get all documents for a driver from storage bucket via backend API
 * @param {string} driverId - Driver ID
 * @returns {Promise<array>} - Array of driver documents with storage URLs
 */
// Helper function to fetch documents from Supabase
const getDriverAllDocumentsFromSupabase = async (driverId) => {
  try {
    console.log('getDriverAllDocumentsFromSupabase: Fetching for driver:', driverId);
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    console.log('getDriverAllDocumentsFromSupabase: Found', data?.length || 0, 'documents');
    return data || [];
  } catch (error) {
    console.error('getDriverAllDocumentsFromSupabase: Error:', error);
    return [];
  }
};

export const getDriverAllDocuments = async (driverId) => {
  try {
    console.log('getDriverAllDocuments: Fetching documents for driver:', driverId);
    
    // Call backend API to list documents (uses service role key, no RLS restrictions)
    const backendUrl = process.env.EXPO_PUBLIC_SMS_API_URL || 'http://192.168.1.114:4000';
    const url = `${backendUrl}/api/upload/list-documents/${driverId}`;
    
    console.log('getDriverAllDocuments: Calling backend API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getDriverAllDocuments: Backend returned error:', response.status, errorData);
      console.error('getDriverAllDocuments: Please ensure backend is running on', backendUrl);
      
      // Try to fetch directly from Supabase as fallback for old drivers
      console.log('getDriverAllDocuments: Falling back to Supabase direct query');
      return await getDriverAllDocumentsFromSupabase(driverId);
    }

    const result = await response.json();
    console.log('getDriverAllDocuments: Backend response:', result);
    console.log('getDriverAllDocuments: Found', result.documents?.length || 0, 'documents');
    
    if (result.documents && Array.isArray(result.documents)) {
      console.log('getDriverAllDocuments: Documents:', JSON.stringify(result.documents, null, 2));
      return result.documents;
    }

    console.log('getDriverAllDocuments: No documents in response');
    return [];
  } catch (error) {
    console.error('Error getting all driver documents:', error);
    console.error('Error details:', error.message);
    console.error('Please verify backend is running and accessible');
    
    // Try Supabase fallback
    try {
      console.log('getDriverAllDocuments: Attempting Supabase fallback');
      return await getDriverAllDocumentsFromSupabase(driverId);
    } catch (fallbackError) {
      console.error('getDriverAllDocuments: Fallback also failed:', fallbackError);
      return [];
    }
  }
};;

/**
 * Approve a document (admin only)
 * @param {string} driverId - Driver ID
 * @param {string} documentType - Document type
 * @returns {Promise<void>}
 */
export const approveDocument = async (driverId, documentType) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('driver_documents')
      .update({
        status: 'approved',
        verified_at: new Date().toISOString(),
        ...(user?.id ? { verified_by: user.id } : {}),
      })
      .eq('driver_id', driverId)
      .eq('document_type', documentType);

    if (error) throw error;
  } catch (error) {
    console.error('Error approving document:', error);
    throw error;
  }
};

/**
 * Reject a document with reason (admin only)
 * @param {string} driverId - Driver ID
 * @param {string} documentType - Document type
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<void>}
 */
export const rejectDocument = async (driverId, documentType, rejectionReason) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('driver_documents')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        verified_at: new Date().toISOString(),
        ...(user?.id ? { verified_by: user.id } : {}),
      })
      .eq('driver_id', driverId)
      .eq('document_type', documentType);

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting document:', error);
    throw error;
  }
};

/**
 * Check if all documents are approved
 * @param {array} documents - Array of driver documents
 * @returns {boolean}
 */
export const areAllDocumentsApproved = (documents) => {
  if (!documents || documents.length === 0) return false;
  const requiredTypes = ['DL', 'VEHICLE_FRONT', 'INSURANCE', 'FC', 'EMISSION', 'RC', 'AADHAR', 'BANK_PASSBOOK_FRONT', 'DRIVER_SELFIE'];
  const approvedTypes = documents
    .filter(doc => doc.status === 'approved')
    .map(doc => doc.document_type);
  return requiredTypes.every(type => approvedTypes.includes(type));
};

/**
 * Get document verification summary
 * @param {array} documents - Array of driver documents
 * @returns {object} - Summary with counts and status
 */
export const getDocumentSummary = (documents) => {
  if (!documents || documents.length === 0) {
    return {
      total: 9,
      approved: 0,
      rejected: 0,
      pending: 9,
      isComplete: false,
      hasRejections: false,
    };
  }

  const approved = documents.filter(doc => doc.status === 'approved').length;
  const rejected = documents.filter(doc => doc.status === 'rejected').length;
  const pending = documents.filter(doc => doc.status === 'pending').length;

  return {
    total: 9,
    approved,
    rejected,
    pending,
    isComplete: approved === 9,
    hasRejections: rejected > 0,
  };
};

/**
 * Get document type label
 * @param {string} documentType - Document type
 * @returns {string} - Human-readable label
 */
export const getDocumentLabel = (documentType) => {
  const labels = {
    DL: 'Driver License',
    VEHICLE_FRONT: 'Vehicle Front Photo',
    INSURANCE: 'Insurance Certificate',
    FC: 'Vehicle F C',
    EMISSION: 'Emission Test Certificate',
    RC: 'Registration Certificate',
    AADHAR: 'Aadhar ID',
    BANK_PASSBOOK_FRONT: 'Bank Passbook Front',
    DRIVER_SELFIE: 'Driver Selfie',
  };
  return labels[documentType] || documentType;
};

/**
 * Get document type icon
 * @param {string} documentType - Document type
 * @returns {string} - Icon name
 */
export const getDocumentIcon = (documentType) => {
  const icons = {
    DL: 'card-outline',
    VEHICLE_FRONT: 'car-outline',
    INSURANCE: 'document-outline',
    FC: 'checkmark-circle-outline',
    EMISSION: 'leaf-outline',
    RC: 'document-text-outline',
    AADHAR: 'id-card-outline',
    BANK_PASSBOOK_FRONT: 'document-text-outline',
    DRIVER_SELFIE: 'person-circle-outline',
  };
  return icons[documentType] || 'document-outline';
};

/**
 * Convert base64 to data URI for image display
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} mimeType - MIME type (default: image/jpeg)
 * @returns {string} - Data URI
 */
export const base64ToDataUri = (base64Data, mimeType = 'image/jpeg') => {
  if (!base64Data) return null;
  return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Fetch all vendor documents from backend (reads from vendor_documents table only)
 * @param {string} userId - Vendor user ID
 * @returns {Promise<Array>} - Array of vendor documents with data from database
 */
export const getVendorAllDocuments = async (userId) => {
  try {
    console.log('getVendorAllDocuments: Fetching documents for vendor user:', userId);
    
    // Call backend API to fetch vendor documents from database table
    const backendUrl = process.env.EXPO_PUBLIC_SMS_API_URL || 'http://192.168.1.114:4000';
    const url = `${backendUrl}/api/upload/list-vendor-documents/${userId}`;
    
    console.log('getVendorAllDocuments: Calling backend API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getVendorAllDocuments: Backend returned error:', response.status, errorData);
      return [];
    }

    const result = await response.json();
    console.log('getVendorAllDocuments: Backend response:', result);
    console.log('getVendorAllDocuments: Found', result.documents?.length || 0, 'documents');
    
    if (result.documents && Array.isArray(result.documents)) {
      console.log('getVendorAllDocuments: Documents from database:', JSON.stringify(result.documents, null, 2));
      return result.documents;
    }

    console.log('getVendorAllDocuments: No documents in response');
    return [];
  } catch (error) {
    console.error('Error getting vendor documents:', error);
    console.error('Error details:', error.message);
    return [];
  }
};

