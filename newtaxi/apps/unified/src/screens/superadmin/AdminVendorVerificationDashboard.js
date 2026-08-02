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
import { useTheme } from '../../hooks/useTheme';
import { COLORS, API_CONFIG } from '../../constants';
import DocumentViewer from '../../components/DocumentViewer';
import { getPendingVerifications, getDriverAllDocuments, getVendorAllDocuments } from '../../services/documentService';

const AdminVendorVerificationDashboard = () => {
  const { forceUpdate } = useTheme();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [mainTabIndex, setMainTabIndex] = useState(0); // 0: Vendors, 1: Drivers
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
          try {
            const [userResult, vendorResult] = await Promise.all([
              supabase.rpc('get_user_by_id', { p_user_id: verification.user_id }),
              supabase.rpc('get_vendor_by_id', { p_vendor_id: verification.vendor_id }),
            ]);

            const userData = userResult.data?.[0] || null;
            const vendorData = vendorResult.data?.[0] || null;
            
            // Fetch vendor documents from backend (reads from vendor_documents table)
            const documentArray = await getVendorAllDocuments(verification.user_id);
            
            // Transform array to object keyed by document_type
            const documents = {};
            if (Array.isArray(documentArray)) {
              documentArray.forEach(doc => {
                documents[doc.document_type] = {
                  status: doc.status,
                  document_type: doc.document_type,
                  uploaded_at: doc.uploaded_at,
                  url: doc.document_url || null,
                  document_url: doc.document_url || null,
                  document_data: doc.document_data || null,  // May have base64 data
                  rejection_reason: doc.rejection_reason,
                };
              });
            }

            return {
              ...verification,
              users: userData,
              vendors: vendorData,
              documents,
            };
          } catch (error) {
            console.error('Error enriching vendor verification:', error);
            return {
              ...verification,
              users: null,
              vendors: null,
              documents: {},
            };
          }
        })
      );

      console.log('✅ All vendor verifications loaded:', verificationsWithDocs.length);
      setPendingVendors(verificationsWithDocs);
    } catch (error) {
      console.error('Error loading vendor verifications:', error);
      Alert.alert('Error', 'Failed to load vendor verifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [tabIndex]);

  // Load pending driver verifications
  const loadDriverVerifications = useCallback(async () => {
    try {
      setLoading(true);

      console.log('Loading driver verifications...');

      // Get pending driver verifications using the service function
      const driverVerifications = await getPendingVerifications();

      if (!driverVerifications || driverVerifications.length === 0) {
        setPendingDrivers([]);
        return;
      }

      // Fetch driver info and documents for each record
      const verificationsWithDocs = await Promise.all(
        driverVerifications.map(async (verification) => {
          try {
            // Get driver user info
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', verification.driver_id)
              .single();

            if (userError && userError.code !== 'PGRST116') {
              console.error('Error fetching user:', userError);
            }

            // Get driver documents as array from backend
            const documentArray = await getDriverAllDocuments(verification.driver_id);

            // Transform array to object keyed by document_type
            const documents = {};
            if (Array.isArray(documentArray)) {
              documentArray.forEach(doc => {
                // Map status: backend returns 'pending', 'approved', 'rejected'
                let displayStatus = doc.status;
                if (doc.status === 'pending') {
                  displayStatus = 'Uploaded - Pending Review';
                } else if (doc.status === 'approved') {
                  displayStatus = 'Approved';
                } else if (doc.status === 'rejected') {
                  displayStatus = 'Rejected';
                }
                
                documents[doc.document_type] = {
                  status: displayStatus,
                  document_type: doc.document_type,
                  uploaded_at: doc.uploaded_at,
                  url: doc.document_url,
                  document_url: doc.document_url,
                };
              });
            }

            return {
              ...verification,
              user_id: verification.driver_id,
              users: userData || { full_name: 'Unknown', phone: 'N/A' },
              documents: documents,
            };
          } catch (error) {
            console.error('Error enriching driver verification:', error);
            return {
              ...verification,
              user_id: verification.driver_id,
              users: { full_name: 'Unknown', phone: 'N/A' },
              documents: {},
            };
          }
        })
      );

      console.log('✅ Driver verifications loaded:', verificationsWithDocs.length);
      setPendingDrivers(verificationsWithDocs);
    } catch (error) {
      console.error('Error loading driver verifications:', error);
      Alert.alert('Error', 'Failed to load driver verifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (mainTabIndex === 0) {
        loadVendorVerifications();
      } else {
        loadDriverVerifications();
      }
    }, [mainTabIndex, loadVendorVerifications, loadDriverVerifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mainTabIndex === 0) {
      await loadVendorVerifications();
    } else {
      await loadDriverVerifications();
    }
    setRefreshing(false);
  }, [mainTabIndex, loadVendorVerifications, loadDriverVerifications]);

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
              const backendUrl = process.env.EXPO_PUBLIC_SMS_API_URL || 'http://192.168.1.114:4000';

              // Use backend API instead of RPC for faster performance
              const response = await fetch(`${backendUrl}/admin/approve-vendor/${vendorId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Approval failed: ${response.status}`);
              }

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
      const backendUrl = process.env.EXPO_PUBLIC_SMS_API_URL || 'http://192.168.1.114:4000';

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
        // Use backend API instead of RPC for faster rejection
        const response = await fetch(`${backendUrl}/admin/reject-vendor/${selectedVendor.vendor_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectionReason: rejectionReason,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Rejection failed: ${response.status}`);
        }

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
                          console.log('📸 Opening vendor document:', docType, 'has_url:', !!doc.document_url, 'has_data:', !!doc.document_data);
                          setSelectedDocument({
                            url: doc.document_url || null,
                            data: doc.document_data || null,
                            type: docType,
                          });
                          setViewerVisible(true);
                        } else {
                          console.warn('⚠️ No URL or data for document:', docType);
                        }
                      }}
                    >
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={doc?.document_url || doc?.document_data ? COLORS.vendor.primary : '#ccc'}
                      />
                      <View style={styles.documentDetails}>
                        <Text style={styles.documentName}>
                          {getDocumentLabel(docType)}
                        </Text>
                        <Text style={styles.documentStatus}>
                          Status: {doc?.status === 'approved' ? 'Approved' : doc?.status === 'rejected' ? 'Rejected' : doc?.status === 'pending' ? 'Pending' : 'Pending Review'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Approve/Reject buttons — show ONLY on Pending tab for pending docs that have data */}
                    {tabIndex === 0 && (doc?.document_url || doc?.document_data) && (doc?.status === 'pending' || doc?.status === 'Uploaded - Pending Review') && (
                      <View style={styles.documentActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={async () => {
                              try {
                                setActionLoading(true);
                                const backendUrl = process.env.EXPO_PUBLIC_SMS_API_URL || 'http://192.168.1.114:4000';

                                // Use backend API for faster document approval
                                const response = await fetch(
                                  `${backendUrl}/admin/approve-vendor-document/${vendor.user_id}/${docType}`,
                                  {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                  }
                                );

                                if (!response.ok) {
                                  const errorData = await response.json().catch(() => ({}));
                                  throw new Error(errorData.error || `Approval failed: ${response.status}`);
                                }

                                const result = await response.json();

                                if (result.vendorApproved) {
                                  // All docs approved — vendor fully approved
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
                                  // Partial approval — update local state
                                  const updatedDocs = { ...vendor.documents };
                                  updatedDocs[docType] = {
                                    ...updatedDocs[docType],
                                    status: 'approved',
                                    approved_at: new Date().toISOString(),
                                  };

                                  setPendingVendors((prevVendors) =>
                                    prevVendors.map((v) =>
                                      v.user_id === vendor.user_id
                                        ? { ...v, documents: updatedDocs }
                                        : v
                                    )
                                  );
                                  Alert.alert('Success', `${getDocumentLabel(docType)} approved (${result.approvedCount}/${result.totalRequired})`);
                                }
                              } catch (error) {
                                console.error('Error approving document:', error);
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

            {/* Overall Approve Button — show ONLY on Pending tab */}
            {tabIndex === 0 && (() => {
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

  // Render driver card similar to vendor but for drivers
  const renderDriverCard = ({ item: driver }) => {
    if (!driver.users) return null;

    return (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => setSelectedDriver(selectedDriver?.user_id === driver.user_id ? null : driver)}
        activeOpacity={0.7}
      >
        {/* Driver Header */}
        <View style={styles.vendorHeader}>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorAvatar}>
              <Ionicons name="person-circle-outline" size={32} color={COLORS.driver?.primary || '#4CAF50'} />
            </View>
            <View style={styles.vendorDetailInfo}>
              {/* PENDING badge */}
              <View style={styles.newBadge}>
                <Ionicons
                  name="clock-outline"
                  size={11}
                  color="#2196F3"
                />
                <Text style={[
                  styles.badgeText,
                  { color: '#2196F3' }
                ]}>
                  PENDING
                </Text>
              </View>
              <Text style={styles.vendorName}>{driver.users?.full_name || 'Unknown Driver'}</Text>
              <Text style={styles.vendorPhone}>{driver.users?.phone || 'N/A'}</Text>
            </View>
          </View>
          <Ionicons
            name={selectedDriver?.user_id === driver.user_id ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.textSecondary}
          />
        </View>

        {/* Expanded Documents Section */}
        {selectedDriver?.user_id === driver.user_id && (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Documents</Text>
            {Object.keys(driver.documents).length > 0 ? (
              Object.entries(driver.documents).map(([docType, doc]) => {
                return (
                  <View key={`${driver.user_id}-${docType}`} style={styles.documentRow}>
                    <TouchableOpacity
                      style={styles.documentInfo}
                      onPress={() => {
                        if (doc?.url || doc?.document_url) {
                          const documentUrl = doc.url || doc.document_url;
                          console.log('📸 Opening document viewer for:', docType, 'URL:', documentUrl);
                          setSelectedDocument({
                            url: documentUrl,
                            type: docType,
                          });
                          setViewerVisible(true);
                        } else {
                          console.warn('⚠️ No URL available for document:', docType, 'Status:', doc?.status);
                        }
                      }}
                    >
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={doc?.status ? COLORS.driver?.primary || '#4CAF50' : '#ccc'}
                      />
                      <View style={styles.documentDetails}>
                        <Text style={styles.documentName}>
                          {docType.replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.documentStatus}>
                          Status: {doc?.status || 'Pending'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {doc?.status === 'Uploaded - Pending Review' && (
                      <View style={styles.documentActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={async () => {
                            try {
                              setActionLoading(true);

                              // Update driver document status to approved
                              const { error: updateError } = await supabase
                                .from('driver_documents')
                                .update({
                                  status: 'approved',
                                  approved_at: new Date().toISOString(),
                                })
                                .eq('driver_id', driver.user_id)
                                .eq('document_type', docType);

                              if (updateError) throw updateError;

                              // Update local state
                              const updatedDocs = { ...driver.documents };
                              updatedDocs[docType] = { ...updatedDocs[docType], status: 'Approved' };
                              
                              setPendingDrivers((prevDrivers) =>
                                prevDrivers.map((d) =>
                                  d.user_id === driver.user_id
                                    ? { ...d, documents: updatedDocs }
                                    : d
                                )
                              );

                              Alert.alert('Success', `${docType} approved`);
                            } catch (error) {
                              Alert.alert('Error', error.message);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading || doc?.status !== 'Uploaded - Pending Review'}
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
                            setSelectedDriver({ ...driver, rejectingDocType: docType });
                            setRejectModalVisible(true);
                          }}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Ionicons name="close" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {doc?.status === 'Approved' && (
                      <View style={styles.statusBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                        <Text style={[styles.statusText, { color: '#4caf50' }]}>
                          Approved
                        </Text>
                      </View>
                    )}

                    {doc?.status === 'Rejected' && (
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
              <Text style={styles.noDocumentsText}>No documents yet</Text>
            )}

            {/* Overall Approve Button */}
            {(() => {
              const allDocsApproved = Object.values(driver.documents || {}).every(
                (doc) => doc?.status === 'Approved'
              );

              return (
                <View style={styles.overallApproveSection}>
                  <Text style={styles.overallApproveHint}>
                    {allDocsApproved
                      ? 'All documents approved — ready to activate driver'
                      : `${Object.values(driver.documents || {}).filter(d => d?.status === 'Approved').length} / ${Object.keys(driver.documents || {}).length} documents approved`}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.overallApproveButton,
                      !allDocsApproved && styles.overallApproveButtonDisabled,
                    ]}
                    disabled={!allDocsApproved || actionLoading}
                    onPress={async () => {
                      try {
                        setActionLoading(true);

                        // Update driver verification status via backend API
                        const approveResponse = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/approve-driver/` + driver.user_id, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                        });

                        if (!approveResponse.ok) {
                          const errorData = await approveResponse.json();
                          throw new Error(errorData.error || 'Failed to approve driver');
                        }

                        Alert.alert('Success', 'Driver approved successfully', [
                          {
                            text: 'OK',
                            onPress: async () => {
                              await loadDriverVerifications();
                            },
                          },
                        ]);
                      } catch (error) {
                        Alert.alert('Error', error.message);
                      } finally {
                        setActionLoading(false);
                      }
                    }}
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
                          Approve Driver
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.overallRejectButton}
                    disabled={actionLoading}
                    onPress={() => {
                      setSelectedDriver(driver);
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
      {/* Tab Bar - Pending, Approved, Rejected */}
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
          documentUrl={selectedDocument?.url}
          documentData={selectedDocument?.data}
          documentType={selectedDocument?.type}
          onClose={() => setViewerVisible(false)}
        />

        {/* Rejection Reason Modal */}
        <Modal visible={rejectModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Reject Vendor Application
              </Text>
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
  mainTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mainTabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  mainTabButtonActive: {
    borderBottomColor: '#2196F3',
  },
  mainTabButtonText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '600',
  },
  mainTabButtonTextActive: {
    color: '#2196F3',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: '#999999',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#ff9800',
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    color: '#000000',
    marginBottom: 2,
  },
  vendorBusiness: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  vendorPhone: {
    fontSize: 11,
    color: '#999999',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: '#000000',
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 11,
    color: '#666666',
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
    padding: 12,
    backgroundColor: '#ffe0e0',
    borderRadius: 8,
    marginTop: 12,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 6,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#c62828',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  reasonInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    color: '#000000',
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#999999',
  },
  modalButtonReject: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#000000',
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
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  overallApproveHint: {
    fontSize: 12,
    color: '#666666',
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
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#999999',
  },
  overallApproveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  overallApproveButtonTextDisabled: {
    color: '#999999',
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
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  reVerifyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  reVerifyBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 17,
  },
});

export default AdminVendorVerificationDashboard;

