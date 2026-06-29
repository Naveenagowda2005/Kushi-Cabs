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
      const verifications = await documentService.getPendingVerifications();
      
      // Fetch documents for each driver
      const verificationsWithDocs = await Promise.all(
        verifications.map(async (verification) => {
          const documents = await documentService.getDriverAllDocuments(verification.driver_id);
          return {
            ...verification,
            documents,
          };
        })
      );
      
      setPendingVerifications(verificationsWithDocs);
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

  const handleViewDocument = (document) => {
    if (document.document_data) {
      setSelectedDocument(document);
      setViewerVisible(true);
    }
  };

  const handleOpenRejectModal = (driverId, documentType) => {
    setRejectingDocument({ driverId, documentType });
    setRejectModalVisible(true);
  };

  const renderDriverCard = ({ item: verification }) => {
    const driver = verification.driver;
    if (!driver) return null;

    // Show documents that are pending_review OR still pending (submitted but status not yet updated)
    const pendingDocuments = verification.documents?.filter(
      doc => doc.status === 'pending_review' || doc.status === 'pending'
    ) || [];

    return (
      <TouchableOpacity
        style={styles.driverCard}
        onPress={() => setSelectedDriver(selectedDriver?.id === driver.id ? null : driver)}
        activeOpacity={0.7}
      >
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driver.full_name || 'Unknown'}</Text>
              <Text style={styles.driverPhone}>{driver.phone}</Text>
              <Text style={styles.driverEmail}>{driver.email}</Text>
            </View>
          </View>
          <Ionicons
            name={selectedDriver?.id === driver.id ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.textSecondary}
          />
        </View>

        {selectedDriver?.id === driver.id && (
          <View style={styles.driverDocuments}>
            <Text style={styles.documentsTitle}>Documents</Text>
            {pendingDocuments && pendingDocuments.length > 0 ? (
              pendingDocuments.map((doc) => (
                <View key={doc.id} style={styles.documentRow}>
                  <TouchableOpacity
                    style={styles.documentInfo}
                    onPress={() => handleViewDocument(doc)}
                  >
                    <Ionicons
                      name={documentService.getDocumentIcon(doc.document_type)}
                      size={20}
                      color={COLORS.primary}
                    />
                    <View style={styles.documentDetails}>
                      <Text style={styles.documentName}>
                        {documentService.getDocumentLabel(doc.document_type)}
                      </Text>
                      <Text style={styles.documentStatus}>
                        Status: {doc.status}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {(doc.status === 'pending_review' || doc.status === 'pending') && (
                    <View style={styles.documentActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveDocument(driver.id, doc.document_type)}
                        disabled={actionLoading}
                      >
                        <Ionicons name="checkmark" size={16} color={COLORS.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleOpenRejectModal(driver.id, doc.document_type)}
                        disabled={actionLoading}
                      >
                        <Ionicons name="close" size={16} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {doc.status === 'approved' && (
                    <View style={styles.statusBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={[styles.statusText, { color: COLORS.success }]}>
                        Approved
                      </Text>
                    </View>
                  )}

                  {doc.status === 'rejected' && (
                    <View style={styles.statusBadge}>
                      <Ionicons name="close-circle" size={16} color={COLORS.error} />
                      <Text style={[styles.statusText, { color: COLORS.error }]}>
                        Rejected
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noDocumentsText}>No documents pending review</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingVerifications}
        renderItem={renderDriverCard}
        keyExtractor={(item) => item.id}
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
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} />
            <Text style={styles.emptyStateText} numberOfLines={2}>All documents verified!</Text>
          </View>
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
  documentsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
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
