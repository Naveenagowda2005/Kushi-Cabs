import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import DocumentUploadCard from '../../components/DocumentUploadCard';
import DocumentViewer from '../../components/DocumentViewer';
import * as documentService from '../../services/documentService';

const REQUIRED_DOCUMENTS = ['AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE'];

const VendorDocumentUploadScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [vendorId, setVendorId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Get vendor ID from vendors table
  useEffect(() => {
    const fetchVendorId = async () => {
      if (!user?.id) return;

      try {
        // Get vendor record by user_id
        const { data: vendor, error } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching vendor:', error);
          return;
        }

        if (vendor?.id) {
          setVendorId(vendor.id);
          loadDocuments(user.id);
        }
      } catch (error) {
        console.error('Error in fetchVendorId:', error);
      }
    };

    fetchVendorId();
  }, [user?.id]);

  // Load documents
  const loadDocuments = useCallback(async (userId) => {
    try {
      setLoading(true);
      console.log('loadDocuments: Loading documents for vendor:', userId);
      
      // Get vendor documents
      const { data: docs, error } = await supabase
        .from('vendor_documents')
        .select('documents')
        .eq('user_id', userId)
        .single();

      // Handle table doesn't exist (PGRST205)
      if (error?.code === 'PGRST205') {
        console.log('vendor_documents table not created yet - showing empty docs');
        const allDocs = REQUIRED_DOCUMENTS.map(type => ({
          document_type: type,
          status: 'pending',
          document_data: null,
          document_url: null,
          rejection_reason: null,
        }));
        setDocuments(allDocs);
        setLoading(false);
        return;
      }

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Create documents list
      const docMap = docs?.documents || {};
      const allDocs = REQUIRED_DOCUMENTS.map(type => {
        const doc = docMap[type];
        return {
          document_type: type,
          status: doc?.status || 'pending',
          document_data: doc?.document_data || null,
          document_url: doc?.document_url || null,
          rejection_reason: doc?.rejection_reason || null,
        };
      });

      console.log('loadDocuments: Final documents list:', allDocs);
      setDocuments(allDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadDocuments(user.id);
      }
    }, [user?.id, loadDocuments])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await loadDocuments(user.id);
    }
    setRefreshing(false);
  }, [user?.id, loadDocuments]);

  const handleUploadDocument = async (documentType, useCamera = false) => {
    try {
      setUploading(prev => ({ ...prev, [documentType]: true }));

      // Pick image using documentService
      const imageData = await documentService.pickDocumentImage(useCamera);
      
      if (!imageData) {
        console.log('handleUploadDocument: User cancelled image selection');
        setUploading(prev => ({ ...prev, [documentType]: false }));
        return;
      }

      console.log('handleUploadDocument: Image picked successfully, size:', imageData.base64?.length || 0);

      // Get existing vendor_documents record or create new one
      const { data: existingDocs, error: fetchError } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no record exists, create new one
      if (!existingDocs && fetchError?.code === 'PGRST116') {
        console.log('handleUploadDocument: No existing record, creating new one');
        
        // Create new record
        const currentDocs = {};
        currentDocs[documentType] = {
          status: 'pending',
          document_data: imageData.base64,
          uploaded_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('vendor_documents')
          .insert({
            user_id: user.id,
            vendor_id: vendorId,
            documents: currentDocs,
          });

        if (insertError) throw insertError;
      } else if (existingDocs) {
        // Update existing record
        console.log('handleUploadDocument: Updating existing record');
        
        const currentDocs = existingDocs.documents || {};
        currentDocs[documentType] = {
          status: 'pending',
          document_data: imageData.base64,
          uploaded_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('vendor_documents')
          .update({
            documents: currentDocs,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else if (fetchError) {
        throw fetchError;
      }

      console.log('handleUploadDocument: Upload successful');
      Alert.alert('Success', `${getDocumentLabel(documentType)} uploaded successfully!`);
      await loadDocuments(user.id);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleViewDocument = (document) => {
    if (document.document_url) {
      setSelectedDocument(document);
      setViewerVisible(true);
    }
  };

  const handleSubmitForVerification = async () => {
    try {
      // Check if all documents are uploaded
      const allUploaded = REQUIRED_DOCUMENTS.every(type => {
        const doc = documents.find(d => d.document_type === type);
        return doc && doc.document_data;
      });

      if (!allUploaded) {
        Alert.alert('Incomplete', 'Please upload all required documents before submitting for verification.');
        return;
      }

      if (!vendorId) {
        Alert.alert('Error', 'Vendor profile not found. Please restart the app and try again.');
        return;
      }

      setSubmitting(true);
      console.log('handleSubmitForVerification: Starting submit for vendor:', vendorId, 'user:', user.id);

      // Use upsert — handles both first-time submit and re-submit after rejection
      const { data: upsertData, error: upsertError } = await supabase
        .from('vendor_verification_status')
        .upsert(
          {
            vendor_id: vendorId,
            user_id: user.id,
            overall_status: 'pending',
            all_documents_submitted: true,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select();

      if (upsertError) {
        console.error('handleSubmitForVerification: Upsert error:', upsertError);
        throw upsertError;
      }

      console.log('handleSubmitForVerification: Upsert success:', upsertData);

      Alert.alert(
        'Success!',
        'Your documents have been submitted for verification.\n\nPlease wait for admin approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              try {
                console.log('handleSubmitForVerification: Navigating to WaitingForApproval');
                navigation.navigate('WaitingForApproval');
              } catch (navError) {
                console.error('Navigation error:', navError);
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('handleSubmitForVerification: Error:', error);
      Alert.alert('Submission Failed', error.message || 'Failed to submit documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentLabel = (type) => {
    const labels = {
      AADHAR: 'Aadhar Card',
      PAN_CARD: 'PAN Card',
      BANK_PASSBOOK_FRONT: 'Bank Passbook (Front Page)',
      VENDOR_SELFIE: 'Selfie (with Aadhar)',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.vendor.primary} />
      </View>
    );
  }

  const uploadedCount = documents.filter(d => d.document_data).length;
  const allUploaded = uploadedCount === REQUIRED_DOCUMENTS.length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="document-text-outline" size={40} color={COLORS.vendor.primary} />
          <Text style={styles.title}>Verification Documents</Text>
          <Text style={styles.subtitle}>Please upload all documents for verification</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(uploadedCount / REQUIRED_DOCUMENTS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {uploadedCount} of {REQUIRED_DOCUMENTS.length} documents uploaded
          </Text>
        </View>

        {/* Documents List */}
        <View style={styles.documentsContainer}>
          {documents.map((doc, index) => (
            <DocumentUploadCard
              key={index}
              documentType={doc.document_type}
              status={doc.status}
              rejectionReason={doc.rejection_reason}
              onUpload={handleUploadDocument}
              isUploading={uploading[doc.document_type]}
              hasData={!!doc.document_data}
            />
          ))}
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Required Documents</Text>
          <Text style={styles.infoText}>• Aadhar Card (clear photo)</Text>
          <Text style={styles.infoText}>• PAN Card (clear photo)</Text>
          <Text style={styles.infoText}>• Bank Passbook Front Page</Text>
          <Text style={styles.infoText}>• Your Selfie with Aadhar Card</Text>
        </View>
      </ScrollView>

      {/* Submit button */}
      {allUploaded && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmitForVerification}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Submit for Verification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        visible={viewerVisible}
        document={selectedDocument}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f3460',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#16213e',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.vendor.primary,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
  },
  documentsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  infoSection: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0f3460',
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  submitBtn: {
    backgroundColor: COLORS.vendor.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default VendorDocumentUploadScreen;
