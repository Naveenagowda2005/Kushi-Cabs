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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import DocumentUploadCard from '../../components/DocumentUploadCard';
import DocumentViewer from '../../components/DocumentViewer';
import * as documentService from '../../services/documentService';

const REQUIRED_DOCUMENTS = ['DL', 'VEHICLE_FRONT', 'INSURANCE', 'FC', 'EMISSION', 'RC', 'AADHAR', 'BANK_PASSBOOK_FRONT', 'DRIVER_SELFIE'];

const DriverDocumentUploadScreen = ({ navigation }) => {
  const { signOut, session } = useAuth();
  const [driverId, setDriverId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Get current user from auth context first, fallback to supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log('DriverDocumentUploadScreen: Getting current user, session user id:', session?.user?.id);
        
        // Use session from AuthContext first
        if (session?.user?.id) {
          console.log('DriverDocumentUploadScreen: Setting driverId from session:', session.user.id);
          setDriverId(session.user.id);
          return;
        }
        
        // Fallback to supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('DriverDocumentUploadScreen: Setting driverId from supabase:', user.id);
          setDriverId(user.id);
        } else {
          console.error('DriverDocumentUploadScreen: No user found');
          Alert.alert('Error', 'User not authenticated');
          setLoading(false);
        }
      } catch (error) {
        console.error('DriverDocumentUploadScreen: Error getting user:', error);
        Alert.alert('Error', 'Failed to get user information');
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, [session]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!driverId) {
      console.log('loadDocuments: No driverId yet, skipping');
      return;
    }

    try {
      setLoading(true);
      console.log('loadDocuments: Loading documents for driver:', driverId);
      
      // Add timeout protection
      const docsPromise = documentService.getDriverAllDocuments(driverId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Document loading timeout')), 15000)
      );
      
      const docs = await Promise.race([docsPromise, timeoutPromise]);
      
      console.log('loadDocuments: Retrieved documents count:', docs?.length);
      
      // Create a map of documents by type
      const docMap = {};
      if (docs && Array.isArray(docs)) {
        docs.forEach(doc => {
          console.log(`loadDocuments: Mapping document type: ${doc.document_type}, has URL: ${!!doc.document_url}`);
          docMap[doc.document_type] = doc;
        });
      }

      console.log('loadDocuments: DocMap keys:', Object.keys(docMap));

      // Ensure all required documents are in the list
      // For each required type, use the uploaded document if exists, otherwise create pending placeholder
      const allDocs = REQUIRED_DOCUMENTS.map(type => {
        const uploadedDoc = docMap[type];
        
        if (uploadedDoc && uploadedDoc.document_url) {
          // Document exists in bucket - show it with URL
          console.log(`loadDocuments: ✅ Found uploaded document for ${type}: ${uploadedDoc.document_url}`);
          return uploadedDoc;
        } else {
          // Document not uploaded yet - show as pending
          console.log(`loadDocuments: ❌ No uploaded document found for ${type}`);
          return { 
            document_type: type, 
            status: 'pending', 
            document_url: null,
            rejection_reason: null
          };
        }
      });

      console.log('loadDocuments: Final documents list count:', allDocs.length);
      console.log('loadDocuments: Final documents with URLs:', allDocs.map(d => ({ type: d.document_type, hasUrl: !!d.document_url })));

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents: ' + error.message);
      setDocuments(REQUIRED_DOCUMENTS.map(type => ({ 
        document_type: type, 
        status: 'pending', 
        document_url: null 
      })));
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  }, [loadDocuments]);

  const handleUploadDocument = async (documentType, useCamera) => {
    try {
      console.log('handleUploadDocument: Starting for', documentType, 'useCamera:', useCamera);
      setUploading(prev => ({ ...prev, [documentType]: true }));

      // Pick image
      console.log('handleUploadDocument: Picking image');
      const imageData = await documentService.pickDocumentImage(useCamera);
      
      if (!imageData) {
        console.log('handleUploadDocument: User cancelled image selection');
        setUploading(prev => ({ ...prev, [documentType]: false }));
        return;
      }

      console.log('handleUploadDocument: Image picked successfully, size:', imageData.base64?.length || 0);

      // Upload to storage bucket ONLY (not to database)
      console.log('handleUploadDocument: Uploading to storage bucket');
      const storageUrl = await documentService.uploadDocumentImage(
        driverId,
        documentType,
        imageData
      );

      console.log('handleUploadDocument: Upload successful, storage URL:', storageUrl);

      // Add delay to ensure file is written to storage and indexed before we list
      // Increased from 1000ms to 2000ms for consistency
      console.log('handleUploadDocument: Waiting for storage sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reload documents
      console.log('handleUploadDocument: Reloading documents');
      await loadDocuments();
      
      console.log('handleUploadDocument: Documents reloaded successfully');
      
      Alert.alert(
        'Success', 
        `${documentService.getDocumentLabel(documentType)} uploaded successfully`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Upload error:', error.message, error);
      
      let errorMessage = error.message || 'Failed to upload document';
      
      // Provide helpful error messages
      if (errorMessage.includes('permission')) {
        errorMessage = 'Please grant camera/gallery permissions and try again';
      } else if (errorMessage.includes('too large')) {
        errorMessage = 'Image is too large. Please use a smaller image';
      } else if (errorMessage.includes('empty')) {
        errorMessage = 'Failed to capture image data. Please try again';
      }
      
      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleSubmitDocuments = async () => {
    try {
      console.log('handleSubmitDocuments: Starting submission');
      console.log('handleSubmitDocuments: Documents:', documents);

      // Check if all documents have been uploaded (have document_url from storage)
      const allUploaded = documents.every(doc => !!doc.document_url);
      
      console.log('handleSubmitDocuments: All uploaded check:', allUploaded);
      console.log('handleSubmitDocuments: Documents with URLs:', documents.map(d => ({ type: d.document_type, hasUrl: !!d.document_url })));

      if (!allUploaded) {
        Alert.alert('Incomplete', 'Please upload all required documents');
        return;
      }

      setSubmitting(true);
      await documentService.submitDocumentsForVerification(driverId);
      
      console.log('handleSubmitDocuments: Documents submitted successfully');

      // Navigate to waiting for approval screen
      // WaitingForApproval is now in the same AuthNavigator
      navigation.navigate('WaitingForApproval');
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit documents');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = (document) => {
    if (document.document_url) {
      setSelectedDocument(document);
      setViewerVisible(true);
    }
  };

  const getSummary = () => {
    const approved = documents.filter(d => d.status === 'approved').length;
    const rejected = documents.filter(d => d.status === 'rejected').length;
    const pending = documents.filter(d => d.status === 'pending').length;
    return { approved, rejected, pending };
  };

  const summary = getSummary();
  const allApproved = summary.approved === REQUIRED_DOCUMENTS.length;
  const allDocumentsUploaded = documents.every(doc => !!doc.document_url);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Documents</Text>
          <Text style={styles.headerSubtitle}>
            Please upload all required documents for verification
          </Text>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Verification Progress</Text>
            <Text style={styles.progressCount}>
              {summary.approved}/{REQUIRED_DOCUMENTS.length}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(summary.approved / REQUIRED_DOCUMENTS.length) * 100}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statText}>
                Approved: {summary.approved}
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statText}>
                Pending: {summary.pending}
              </Text>
            </View>
            {summary.rejected > 0 && (
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.statText}>
                  Rejected: {summary.rejected}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Documents List */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.document_type}
              onPress={() => handleViewDocument(doc)}
              activeOpacity={0.7}
            >
              <DocumentUploadCard
                documentType={doc.document_type}
                status={doc.status}
                rejectionReason={doc.rejection_reason}
                onUpload={handleUploadDocument}
                isUploading={uploading[doc.document_type]}
                hasData={!!doc.document_url}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            All documents must be clear and legible. You can re-upload if rejected.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      {!allApproved && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !allDocumentsUploaded && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitDocuments}
            disabled={!allDocumentsUploaded || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.text} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.text} />
                <Text style={styles.submitButtonText}>
                  Submit for Verification
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {allApproved && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !allDocumentsUploaded && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitDocuments}
            disabled={!allDocumentsUploaded || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.text} size="small" />
            ) : (
              <>
                <Ionicons name="reload-outline" size={20} color={COLORS.text} />
                <Text style={styles.submitButtonText}>
                  {allDocumentsUploaded ? 'Re-submit Changes' : 'No Changes to Submit'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.approvedBox}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.approvedBoxText}>Documents approved - you're all set!</Text>
          </View>
        </View>
      )}

      {/* Document Viewer */}
      <DocumentViewer
        visible={viewerVisible}
        documentUrl={selectedDocument?.document_url}
        documentData={selectedDocument?.document_data}
        documentType={selectedDocument?.document_type}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  documentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.info}15`,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    paddingTop: 60,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  approvedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.success}15`,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.success,
    gap: 8,
    marginTop: 12,
  },
  approvedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  approvedBoxText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.success,
  },
});

export default DriverDocumentUploadScreen;
