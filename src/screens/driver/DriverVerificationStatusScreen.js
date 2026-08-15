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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import DocumentViewer from '../../components/DocumentViewer';
import * as documentService from '../../services/documentService';

const DriverVerificationStatusScreen = ({ navigation }) => {
  const [driverId, setDriverId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setDriverId(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Load verification status and documents
  const loadData = useCallback(async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      
      // Get verification status
      const status = await documentService.getDriverVerificationStatus(driverId);
      setVerificationStatus(status);

      // Get all documents
      const docs = await documentService.getDriverAllDocuments(driverId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleReupload = () => {
    navigation.navigate('DriverDocumentUpload');
  };

  const handleViewDocument = (document) => {
    if (document.document_data) {
      setSelectedDocument(document);
      setViewerVisible(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'pending':
      default:
        return COLORS.warning;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
      default:
        return 'time-outline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const summary = documentService.getDocumentSummary(documents);
  const overallStatus = verificationStatus?.overall_status || 'pending';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overall Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardContent}>
            <Ionicons
              name={getStatusIcon(overallStatus)}
              size={48}
              color={getStatusColor(overallStatus)}
            />
            <View style={styles.statusCardText}>
              <Text style={styles.statusCardLabel}>Overall Status</Text>
              <Text
                style={[
                  styles.statusCardValue,
                  { color: getStatusColor(overallStatus) },
                ]}
              >
                {getStatusLabel(overallStatus)}
              </Text>
            </View>
          </View>

          {verificationStatus?.submitted_at && (
            <View style={styles.statusCardMeta}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.statusCardMetaText}>
                Submitted: {new Date(verificationStatus.submitted_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          {verificationStatus?.verified_at && (
            <View style={styles.statusCardMeta}>
              <Ionicons name="checkmark-done-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.statusCardMetaText}>
                Verified: {new Date(verificationStatus.verified_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Document Progress</Text>
            <Text style={styles.progressCount}>
              {summary.approved}/{summary.total}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(summary.approved / summary.total) * 100}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statText}>Approved: {summary.approved}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statText}>Pending: {summary.pending}</Text>
            </View>
            {summary.rejected > 0 && (
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.statText}>Rejected: {summary.rejected}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Documents Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Document Status</Text>
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No documents uploaded yet</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => navigation.navigate('DriverDocumentUpload')}
              >
                <Text style={styles.uploadButtonText}>Upload Documents</Text>
              </TouchableOpacity>
            </View>
          ) : (
            documents.map((doc, index) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.timelineItem}
                onPress={() => handleViewDocument(doc)}
                activeOpacity={0.7}
              >
                <View style={styles.timelineMarker}>
                  <Ionicons
                    name={getStatusIcon(doc.status)}
                    size={20}
                    color={getStatusColor(doc.status)}
                  />
                </View>

                {index < documents.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: getStatusColor(doc.status) },
                    ]}
                  />
                )}

                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineTitle}>
                      {documentService.getDocumentLabel(doc.document_type)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(doc.status)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusColor(doc.status) },
                        ]}
                      >
                        {getStatusLabel(doc.status)}
                      </Text>
                    </View>
                  </View>

                  {doc.uploaded_at && (
                    <Text style={styles.timelineDate}>
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </Text>
                  )}

                  {doc.verified_at && (
                    <Text style={styles.timelineDate}>
                      Verified: {new Date(doc.verified_at).toLocaleDateString()}
                    </Text>
                  )}

                  {doc.rejection_reason && (
                    <View style={styles.rejectionBox}>
                      <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
                      <Text style={styles.rejectionText}>{doc.rejection_reason}</Text>
                    </View>
                  )}

                  {doc.document_data && (
                    <Text style={styles.viewText}>Tap to view document</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            Your documents are being reviewed by our admin team. You'll be notified once the verification is complete.
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      {summary.hasRejections && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.reuploadButton}
            onPress={handleReupload}
          >
            <Ionicons name="reload-outline" size={20} color={COLORS.text} />
            <Text style={styles.reuploadButtonText}>Re-upload Rejected Documents</Text>
          </TouchableOpacity>
        </View>
      )}

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
  scrollView: {
    flex: 1,
  },
  statusCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCardText: {
    marginLeft: 16,
    flex: 1,
  },
  statusCardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  statusCardMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
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
  timelineSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: 60,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  rejectionText: {
    fontSize: 11,
    color: COLORS.error,
    flex: 1,
  },
  viewText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 8,
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reuploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  reuploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default DriverVerificationStatusScreen;
