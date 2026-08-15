import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';
import DocumentViewer from '../../components/DocumentViewer';
import * as documentService from '../../services/documentService';

const AdminVerificationDashboard = () => {
  const { forceUpdate } = useTheme();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingDocument, setRejectingDocument] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load pending verifications
  const loadPendingVerifications = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Starting to load pending verifications');
      
      const verifications = await documentService.getPendingVerifications();
      console.log('📋 getPendingVerifications returned:', verifications?.length || 0, 'records');
      
      // Fetch user details and documents for each verification
      if (verifications && verifications.length > 0) {
        // Get all driver IDs
        const driverIds = verifications.map(v => v.driver_id);
        
        // Fetch all user details at once
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, phone, full_name')
          .in('id', driverIds);
        
        if (usersError) {
          console.warn('📋 Error fetching users:', usersError.message);
        }
        
        // Create user map
        const userMap = {};
        usersData?.forEach(user => {
          userMap[user.id] = user;
        });
        
        // Fetch documents - STORAGE ONLY, no base64 from database
        // Only fetch metadata needed to identify documents
        const { data: allDocuments, error: docError } = await supabase
          .from('driver_documents')
          .select('id, driver_id, document_type, status, created_at, document_mime_type, verified_at, verified_by, rejection_reason, storage_path, document_url, document_data')
          .in('driver_id', driverIds);
        
        if (docError) {
          console.error('📋 Error fetching documents:', docError.message);
        }
        
        // Group documents by driver_id
        const documentsByDriver = {};
        allDocuments?.forEach(doc => {
          if (!documentsByDriver[doc.driver_id]) {
            documentsByDriver[doc.driver_id] = [];
          }
          documentsByDriver[doc.driver_id].push(doc);
        });
        
        console.log('📋 Fetched documents for', Object.keys(documentsByDriver).length, 'drivers');
        
        // Attach user and document data to verifications
        const verificationsWithData = verifications.map(verification => {
          const userData = userMap[verification.driver_id];
          const docs = documentsByDriver[verification.driver_id] || [];
          
          console.log('📋 Driver:', userData?.full_name, '| Documents:', docs.length);
          
          return {
            ...verification,
            full_name: userData?.full_name || 'Unknown',
            phone: userData?.phone || '',
            email: userData?.email || '',
            documents: docs
          };
        });
        
        console.log('📋 Setting pendingVerifications with', verificationsWithData.length, 'items');
        setPendingVerifications(verificationsWithData);
      } else {
        console.log('📋 No pending verifications found');
        setPendingVerifications([]);
      }
      console.log('✅ Loaded', verifications?.length || 0, 'pending verifications');
    } catch (error) {
      console.error('Error loading verifications:', error);
      Alert.alert('Error', 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPendingVerifications();
    }, [loadPendingVerifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPendingVerifications();
    setRefreshing(false);
  }, [loadPendingVerifications]);

  const handleApproveDocument = async (driverId, documentType) => {
    try {
      setActionLoading(true);
      await documentService.approveDocument(driverId, documentType);
      Alert.alert('Success', 'Document approved');
      await loadPendingVerifications();
    } catch (error) {
      console.error('Error approving document:', error);
      Alert.alert('Error', 'Failed to approve document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await documentService.rejectDocument(
        rejectingDocument.driverId,
        rejectingDocument.documentType,
        rejectionReason
      );
      Alert.alert('Success', 'Document rejected');
      setRejectModalVisible(false);
      setRejectionReason('');
      setRejectingDocument(null);
      await loadPendingVerifications();
    } catch (error) {
      console.error('Error rejecting document:', error);
      Alert.alert('Error', 'Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = useCallback(async (document, driverId) => {
    try {
      // Get document URL from backend API
      console.log('📋 Fetching document from backend for driver:', driverId, 'type:', document.document_type);
      
      const documents = await documentService.getDriverAllDocuments(driverId);
      const docWithUrl = documents.find(d => d.document_type === document.document_type);
      
      if (!docWithUrl || !docWithUrl.document_url) {
        return Alert.alert('Error', 'Document URL not found');
      }

      console.log('📋 Viewing document:', document.document_type, docWithUrl.document_url);
      
      // Use public URL directly from backend response
      setSelectedDocument({
        url: docWithUrl.document_url,
        type: document.document_type,
        mimeType: 'image/jpeg'
      });
      setViewerVisible(true);
    } catch (error) {
      console.error('📋 Error viewing document:', error);
      Alert.alert('Error', 'Failed to load document');
    }
  }, []);

  const renderDriverCard = ({ item: verification }) => {
    // Verification now has full_name, phone, email at top level
    if (!verification.driver_id) return null;

    const isExpanded = selectedDriver?.driver_id === verification.driver_id;

    return (
      <TouchableOpacity
        style={styles.driverCard}
        onPress={() => setSelectedDriver(isExpanded ? null : verification)}
        activeOpacity={0.7}
      >
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.driverDetails}>
              <View style={styles.newBadge}>
                <Ionicons
                  name="sparkles-outline"
                  size={11}
                  color="#4caf50"
                />
                <Text style={[styles.badgeText, { color: '#4caf50' }]}>
                  PENDING
                </Text>
              </View>
              <Text style={styles.driverName}>{verification.full_name || 'Unknown'}</Text>
              <Text style={styles.driverPhone}>{verification.phone || 'N/A'}</Text>
              <Text style={styles.driverEmail}>{verification.email || 'N/A'}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.textSecondary}
          />
        </View>

        {isExpanded && (
          <View style={styles.driverDocuments}>
            <Text style={styles.documentsTitle}>Documents for Review</Text>
            {verification.documents && verification.documents.length > 0 ? (
              <>
                <Text style={styles.documentStatusSummary}>Total: {verification.documents.length} documents</Text>
                {verification.documents.map((doc, idx) => {
                  const shouldShow = doc.status === 'pending_review' || doc.status === 'pending';
                  return (
                    <View key={idx} style={styles.documentRow}>
                      <TouchableOpacity
                        style={styles.documentInfo}
                        onPress={() => handleViewDocument(doc, verification.driver_id)}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color={shouldShow ? COLORS.primary : COLORS.textSecondary}
                        />
                        <View style={styles.documentDetails}>
                          <Text style={styles.documentName}>
                            {doc.document_type}
                          </Text>
                          <Text style={styles.documentStatus}>
                            Status: {doc.status} {doc.verified_at ? '✓' : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {shouldShow && (
                        <View style={styles.documentActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleApproveDocument(verification.driver_id, doc.document_type)}
                            disabled={actionLoading}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => {
                              setRejectingDocument({ driverId: verification.driver_id, documentType: doc.document_type });
                              setRejectModalVisible(true);
                            }}
                            disabled={actionLoading}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={styles.noDocumentsText}>No documents available for this driver</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingVerifications}
        renderItem={renderDriverCard}
        keyExtractor={(item) => item.driver_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Document Verification</Text>
            <Text style={styles.headerSubtitle}>
              {pendingVerifications.length} pending verification
              {pendingVerifications.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading verifications...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} />
              <Text style={styles.emptyStateText} numberOfLines={2}>All documents verified!</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Rejection Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Document</Text>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Rejection Reason</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for rejection..."
              placeholderTextColor={COLORS.textTertiary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectConfirmButton}
                onPress={handleRejectDocument}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={COLORS.text} size="small" />
                ) : (
                  <Text style={styles.rejectConfirmButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Viewer */}
      <DocumentViewer
        visible={viewerVisible}
        documentUrl={selectedDocument?.url}
        documentData={selectedDocument?.data}
        documentType={selectedDocument?.type}
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
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 30,
    flexWrap: 'wrap',
    width: '85%',
    numberOfLines: 2,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  driverCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#4caf5020',
    borderWidth: 1,
    borderColor: '#4caf5060',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    gap: 3,
  },
  reUploadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ff980020',
    borderWidth: 1,
    borderColor: '#ff980060',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  driverEmail: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  driverDocuments: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: `${COLORS.primary}05`,
  },
  reVerifyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ff980015',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    gap: 8,
  },
  reVerifyBannerText: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
    lineHeight: 16,
  },
  documentsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  documentStatusSummary: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 8,
    flex: 1,
  },
  documentName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: `${COLORS.success}15`,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noDocumentsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  rejectConfirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  rejectConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default AdminVerificationDashboard;
