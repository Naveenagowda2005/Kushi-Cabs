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
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import DocumentViewer from '../../components/DocumentViewer';

const AdminVendorVerificationDashboard = () => {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); // 0: Pending, 1: Approved, 2: Rejected
  const [forceSyncLoading, setForceSyncLoading] = useState(false);

  // Load pending vendor verifications
  const loadVendorVerifications = useCallback(async () => {
    try {
      setLoading(true);

      const status = tabIndex === 0 ? 'pending' : tabIndex === 1 ? 'approved' : 'rejected';

      // Use RPC to bypass RLS (super admin uses mock session, auth.uid() = null)
      const { data: verifications, error: verificationError } = await supabase
        .rpc('get_vendor_verifications', { p_status: status });

      if (verificationError) throw verificationError;

      if (!verifications || verifications.length === 0) {
        setPendingVendors([]);
        return;
      }

      // Fetch user info, vendor info, and documents for each record
      const verificationsWithDocs = await Promise.all(
        verifications.map(async (verification) => {
          const [userResult, vendorResult, docsResult] = await Promise.all([
            supabase.rpc('get_user_by_id', { p_user_id: verification.user_id }),
            supabase.rpc('get_vendor_by_id', { p_vendor_id: verification.vendor_id }),
            supabase.rpc('get_vendor_documents_by_user', { p_user_id: verification.user_id }),
          ]);

          const userData = userResult.data?.[0] || null;
          const vendorData = vendorResult.data?.[0] || null;
          const documents = docsResult.data?.[0]?.documents || {};

          return {
            ...verification,
            users: userData,
            vendors: vendorData,
            documents,
          };
        })
      );

      console.log('All verifications loaded:', verificationsWithDocs.length);
      setPendingVendors(verificationsWithDocs);
    } catch (error) {
      console.error('Error loading vendor verifications:', error);
      Alert.alert('Error', 'Failed to load vendor verifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [tabIndex]);

  useFocusEffect(
    useCallback(() => {
      loadVendorVerifications();
    }, [loadVendorVerifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVendorVerifications();
    setRefreshing(false);
  }, [loadVendorVerifications]);

  const handleApproveVendor = async (vendorId, userId) => {
    Alert.alert(
      'Approve Vendor',
      'Are you sure you want to approve this vendor application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setActionLoading(true);

              // Use RPC to bypass RLS
              const { error: updateError } = await supabase
                .rpc('update_vendor_verification', {
                  p_vendor_id: vendorId,
                  p_overall_status: 'approved',
                });
              if (updateError) throw updateError;

              await supabase.rpc('update_user_verification_status', {
                p_user_id: userId,
                p_status: 'approved',
              });

              Alert.alert('Success', 'Vendor approved successfully');
              await loadVendorVerifications();
            } catch (error) {
              console.error('Error approving vendor:', error);
              Alert.alert('Error', error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleForceSyncVendorStatuses = async () => {
    Alert.alert(
      'Force Sync Statuses',
      'This will check all pending vendors and automatically approve those with all documents approved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              setForceSyncLoading(true);
              let updatedCount = 0;

              const { data: allPending, error: pendingError } = await supabase
                .rpc('get_vendor_verifications', { p_status: 'pending' });

              if (pendingError) throw pendingError;

              for (const record of allPending || []) {
                const { data: docsData } = await supabase
                  .rpc('get_vendor_documents_by_user', { p_user_id: record.user_id });

                const docs = docsData?.[0]?.documents || {};
                const REQUIRED_DOCS = ['AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE'];
                const allApproved = REQUIRED_DOCS.every((dt) => docs[dt]?.status === 'approved');

                if (allApproved) {
                  const { error: updateError } = await supabase
                    .rpc('update_vendor_verification', {
                      p_vendor_id: record.vendor_id,
                      p_overall_status: 'approved',
                    });
                  if (!updateError) updatedCount++;
                }
              }

              Alert.alert('Success', `Synced ${updatedCount} vendor(s)`);
              await loadVendorVerifications();
            } catch (error) {
              console.error('Error in force sync:', error);
              Alert.alert('Error', error.message);
            } finally {
              setForceSyncLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectVendor = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);

      if (selectedVendor?.rejectingDocType) {
        const docType = selectedVendor.rejectingDocType;
        const updatedDocs = { ...selectedVendor.documents };
        updatedDocs[docType] = {
          ...updatedDocs[docType],
          status: 'rejected',
          rejection_reason: rejectionReason,
          rejected_at: new Date().toISOString(),
        };

        await supabase.rpc('update_vendor_document_status', {
          p_user_id: selectedVendor.user_id,
          p_documents: updatedDocs,
        });

        setPendingVendors((prevVendors) =>
          prevVendors.map((v) =>
            v.user_id === selectedVendor.user_id ? { ...v, documents: updatedDocs } : v
          )
        );

        Alert.alert('Success', `${getDocumentLabel(docType)} rejected`);
      } else {
        await supabase.rpc('update_vendor_verification', {
          p_vendor_id: selectedVendor.vendor_id,
          p_overall_status: 'rejected',
          p_rejection_reason: rejectionReason,
        });

        await supabase.rpc('update_user_verification_status', {
          p_user_id: selectedVendor.user_id,
          p_status: 'rejected',
        });

        setPendingVendors((prevVendors) =>
          prevVendors.filter((v) => v.user_id !== selectedVendor.user_id)
        );

        Alert.alert('Success', 'Vendor application rejected');
      }

      setRejectModalVisible(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting:', error);
      Alert.alert('Error', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const documentTypes = ['AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE'];

  const getDocumentLabel = (type) => {
    const labels = {
      AADHAR: 'Aadhar Card',
      PAN_CARD: 'PAN Card',
      BANK_PASSBOOK_FRONT: 'Bank Passbook (Front)',
      VENDOR_SELFIE: 'Vendor Selfie',
    };
    return labels[type] || type;
  };

  const renderVendorCard = ({ item: vendor }) => {
    if (!vendor.users) return null;

    // is_re_verification = TRUE  → vendor was already approved, just re-uploaded
    // Fallback check: if any document is 'approved', this is a re-verification
    const hasAnyApprovedDoc = Object.values(vendor.documents || {}).some(
      doc => doc?.status === 'approved'
    );
    const isReVerification = vendor.is_re_verification === true || hasAnyApprovedDoc;

    return (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => setSelectedVendor(selectedVendor?.user_id === vendor.user_id ? null : vendor)}
        activeOpacity={0.7}
      >
        {/* Vendor Header */}
        <View style={styles.vendorHeader}>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorAvatar}>
              <Ionicons name="person-circle-outline" size={32} color={COLORS.vendor.primary} />
            </View>
            <View style={styles.vendorDetailInfo}>
              {/* NEW / RE-UPLOAD badge */}
              <View style={isReVerification ? styles.reUploadBadge : styles.newBadge}>
                <Ionicons
                  name={isReVerification ? 'refresh-circle-outline' : 'sparkles-outline'}
                  size={11}
                  color={isReVerification ? '#ff9800' : '#4caf50'}
                />
                <Text style={[
                  styles.badgeText,
                  { color: isReVerification ? '#ff9800' : '#4caf50' }
                ]}>
                  {isReVerification ? 'RE-UPLOAD' : 'NEW'}
                </Text>
              </View>
              <Text style={styles.vendorName}>{vendor.users?.full_name}</Text>
              <Text style={styles.vendorBusiness}>{vendor.vendors?.company_name}</Text>
              <Text style={styles.vendorPhone}>{vendor.users?.phone}</Text>
            </View>
          </View>
          <Ionicons
            name={selectedVendor?.user_id === vendor.user_id ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.textSecondary}
          />
        </View>

        {/* Expanded Documents Section */}
        {selectedVendor?.user_id === vendor.user_id && (
          <View style={styles.documentsSection}>
            {/* Context banner for re-upload requests */}
            {isReVerification && (
              <View style={styles.reVerifyBanner}>
                <Ionicons name="information-circle-outline" size={16} color="#ff9800" />
                <Text style={styles.reVerifyBannerText}>
                  This vendor is already approved. They re-uploaded one or more documents for your review. Their dashboard access continues uninterrupted.
                </Text>
              </View>
            )}
            <Text style={styles.sectionTitle}>Documents</Text>
            {documentTypes && documentTypes.length > 0 ? (
              documentTypes.map((docType) => {
                const doc = vendor.documents[docType];
                return (
                  <View key={docType} style={styles.documentRow}>
                    <TouchableOpacity
                      style={styles.documentInfo}
                      onPress={() => {
                        if (doc?.document_url || doc?.document_data) {
                          setSelectedDocument({
                            data: doc.document_data,
                            type: docType,
                          });
                          setViewerVisible(true);
                        }
                      }}
                    >
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={doc?.document_data ? COLORS.vendor.primary : '#ccc'}
                      />
                      <View style={styles.documentDetails}>
                        <Text style={styles.documentName}>
                          {getDocumentLabel(docType)}
                        </Text>
                        <Text style={styles.documentStatus}>
                          Status: {doc?.status === 'approved' ? 'Approved' : doc?.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Approve/Reject buttons — show on Pending tab for pending docs,
                        OR on Approved tab if a doc was re-uploaded and is now pending again */}
                    {(tabIndex === 0 || tabIndex === 1) && doc?.document_data && doc?.status === 'pending' && (
                      <View style={styles.documentActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={async () => {
                              try {
                                setActionLoading(true);

                                // Update document status to approved using RPC
                                const updatedDocs = { ...vendor.documents };
                                updatedDocs[docType] = {
                                  ...updatedDocs[docType],
                                  status: 'approved',
                                  approved_at: new Date().toISOString(),
                                };

                                const { error: docUpdateError } = await supabase
                                  .rpc('update_vendor_document_status', {
                                    p_user_id: vendor.user_id,
                                    p_documents: updatedDocs,
                                  });

                                if (docUpdateError) throw docUpdateError;

                                // Check if ALL REQUIRED documents are now approved
                                const REQUIRED_DOCS = ['AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE'];
                                const allApproved = REQUIRED_DOCS.every(
                                  (dt) => updatedDocs[dt]?.status === 'approved'
                                );

                                if (allApproved) {
                                  // All docs approved — approve the vendor
                                  await supabase.rpc('update_vendor_verification', {
                                    p_vendor_id: vendor.vendor_id,
                                    p_overall_status: 'approved',
                                  });

                                  await supabase.rpc('update_user_verification_status', {
                                    p_user_id: vendor.user_id,
                                    p_status: 'approved',
                                  });

                                  Alert.alert('Success', `${getDocumentLabel(docType)} approved — Vendor fully approved!`, [
                                    {
                                      text: 'OK',
                                      onPress: async () => {
                                        setLoading(true);
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        await loadVendorVerifications();
                                      },
                                    },
                                  ]);
                                } else {
                                  // Partial approval — update local state only
                                  setPendingVendors((prevVendors) =>
                                    prevVendors.map((v) =>
                                      v.user_id === vendor.user_id
                                        ? { ...v, documents: updatedDocs }
                                        : v
                                    )
                                  );
                                  Alert.alert('Success', `${getDocumentLabel(docType)} approved`);
                                }
                              } catch (error) {
                                Alert.alert('Error', error.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            disabled={actionLoading || doc?.status === 'approved'}
                          >
                            {actionLoading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                          </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => {
                            setSelectedVendor({ ...vendor, rejectingDocType: docType });
                            setRejectModalVisible(true);
                          }}
                          disabled={actionLoading || doc?.status === 'rejected'}
                        >
                          {actionLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Ionicons name="close" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {doc?.status === 'approved' && (
                      <View style={styles.statusBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                        <Text style={[styles.statusText, { color: '#4caf50' }]}>
                          Approved
                        </Text>
                      </View>
                    )}

                    {doc?.status === 'rejected' && (
                      <View style={styles.statusBadge}>
                        <Ionicons name="close-circle" size={16} color="#f44336" />
                        <Text style={[styles.statusText, { color: '#f44336' }]}>
                          Rejected
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDocumentsText}>No documents pending review</Text>
            )}

            {tabIndex === 2 && vendor.rejection_reason && (
              <View style={styles.rejectionReasonBox}>
                <Text style={styles.rejectionReasonLabel}>Rejection Reason:</Text>
                <Text style={styles.rejectionReasonText}>{vendor.rejection_reason}</Text>
              </View>
            )}

            {/* Overall Approve Button — show on Pending tab and Approved tab (for re-submitted docs) */}
            {(tabIndex === 0 || tabIndex === 1) && (() => {
              const REQUIRED_DOCS = ['AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE'];
              const allDocsApproved = REQUIRED_DOCS.every(
                (dt) => vendor.documents[dt]?.status === 'approved'
              );
              const approvedCount = REQUIRED_DOCS.filter(
                (dt) => vendor.documents[dt]?.status === 'approved'
              ).length;

              return (
                <View style={styles.overallApproveSection}>
                  <Text style={styles.overallApproveHint}>
                    {allDocsApproved
                      ? 'All documents approved — ready to activate vendor'
                      : `${approvedCount} / ${REQUIRED_DOCS.length} documents approved`}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.overallApproveButton,
                      !allDocsApproved && styles.overallApproveButtonDisabled,
                    ]}
                    disabled={!allDocsApproved || actionLoading}
                    onPress={() => handleApproveVendor(vendor.vendor_id, vendor.user_id)}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={allDocsApproved ? '#fff' : '#666'}
                        />
                        <Text style={[
                          styles.overallApproveButtonText,
                          !allDocsApproved && styles.overallApproveButtonTextDisabled,
                        ]}>
                          Approve Vendor
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.overallRejectButton}
                    disabled={actionLoading}
                    onPress={() => {
                      setSelectedVendor(vendor);
                      setRejectModalVisible(true);
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.overallRejectButtonText}>Reject Application</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.vendor.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {['Pending', 'Approved', 'Rejected'].map((label, index) => (
          <TouchableOpacity
            key={label}
            style={[styles.tabButton, tabIndex === index && styles.tabButtonActive]}
            onPress={() => setTabIndex(index)}
          >
            <Text style={[styles.tabButtonText, tabIndex === index && styles.tabButtonTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Force Sync Button */}
      {tabIndex === 0 && (
        <TouchableOpacity
          style={styles.forceSyncButton}
          onPress={handleForceSyncVendorStatuses}
          disabled={forceSyncLoading}
        >
          {forceSyncLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.forceSyncButtonText}>Force Sync All Approved Vendors</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <FlatList
        data={pendingVendors}
        renderItem={renderVendorCard}
        keyExtractor={(item) => item.user_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText} numberOfLines={2}>No vendors to review</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Document Viewer Modal */}
      <DocumentViewer
        visible={viewerVisible}
        documentData={selectedDocument?.data}
        documentType={selectedDocument?.type}
        onClose={() => setViewerVisible(false)}
      />

      {/* Rejection Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Vendor Application</Text>
            <Text style={styles.modalSubtitle}>
              {selectedVendor?.users?.full_name} - {selectedVendor?.vendors?.company_name}
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Enter rejection reason..."
              placeholderTextColor="#888"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonReject, actionLoading && styles.buttonDisabled]}
                onPress={handleRejectVendor}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0d0f1a',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.vendor.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: COLORS.vendor.primary,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 30,
    flexWrap: 'wrap',
    width: '85%',
    numberOfLines: 2,
  },
  vendorCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#0d0f1a',
    overflow: 'hidden',
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.vendor.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vendorDetailInfo: {
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
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  vendorBusiness: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  vendorPhone: {
    fontSize: 11,
    color: '#bbb',
  },
  noDocumentsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0d0f1a',
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
    color: '#fff',
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 11,
    color: '#888',
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
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectionReasonBox: {
    padding: 16,
    backgroundColor: '#ff525220',
    borderTopWidth: 1,
    borderTopColor: '#0d0f1a',
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff5252',
    marginBottom: 6,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#bbb',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  reasonInput: {
    backgroundColor: '#0d0f1a',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#888',
  },
  modalButtonReject: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forceSyncButton: {
    backgroundColor: COLORS.vendor.primary,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  forceSyncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  overallApproveSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0d0f1a',
    gap: 10,
  },
  overallApproveHint: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 4,
  },
  overallApproveButton: {
    backgroundColor: '#4caf50',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overallApproveButtonDisabled: {
    backgroundColor: '#1e2a1e',
    borderWidth: 1,
    borderColor: '#333',
  },
  overallApproveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  overallApproveButtonTextDisabled: {
    color: '#666',
  },
  overallRejectButton: {
    backgroundColor: '#c62828',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overallRejectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  reVerifyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ff980015',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  reVerifyBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#ffb74d',
    lineHeight: 17,
  },
});

export default AdminVendorVerificationDashboard;
