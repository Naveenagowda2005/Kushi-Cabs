import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import * as documentService from '../../services/documentService';

const STEPS = [
  {
    id: 1,
    title: 'Account Created',
    description: 'Your account has been successfully created',
    icon: 'checkmark-circle',
  },
  {
    id: 2,
    title: 'Documents Uploaded',
    description: 'Upload all 6 required documents',
    icon: 'document-outline',
  },
  {
    id: 3,
    title: 'Documents Submitted',
    description: 'Documents sent for admin verification',
    icon: 'send-outline',
  },
  {
    id: 4,
    title: 'Under Review',
    description: 'Admin is reviewing your documents',
    icon: 'eye-outline',
  },
  {
    id: 5,
    title: 'Account Approved',
    description: 'You can now login and start driving',
    icon: 'checkmark-done-circle',
  },
];

const DriverOnboardingTimelineScreen = ({ navigation }) => {
  const [driverId, setDriverId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);

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

  // Load timeline data
  const loadTimelineData = useCallback(async () => {
    if (!driverId) {
      console.log('loadTimelineData: No driverId');
      return;
    }

    try {
      setLoading(true);

      console.log('loadTimelineData: Loading for driver:', driverId);

      // Get documents
      const docs = await documentService.getDriverAllDocuments(driverId);
      console.log('loadTimelineData: Retrieved documents:', docs);
      setDocuments(docs);

      // Get verification status
      const status = await documentService.getDriverVerificationStatus(driverId);
      console.log('loadTimelineData: Verification status:', status);
      setVerificationStatus(status);

      // Determine current step
      let step = 1; // Account created (always true if we're here)

      console.log('loadTimelineData: Checking step logic');
      console.log('  - docs.length:', docs?.length);
      console.log('  - all_documents_submitted:', status?.all_documents_submitted);
      console.log('  - overall_status:', status?.overall_status);

      if (docs && docs.length > 0) {
        step = 2; // Documents uploaded
        console.log('loadTimelineData: Step 2 - Documents uploaded');
      }

      if (status?.all_documents_submitted) {
        step = 3; // Documents submitted
        console.log('loadTimelineData: Step 3 - Documents submitted');
      }

      if (status?.overall_status === 'pending' && status?.all_documents_submitted) {
        step = 4; // Under review
        console.log('loadTimelineData: Step 4 - Under review');
      }

      if (status?.overall_status === 'approved') {
        step = 5; // Account approved
        console.log('loadTimelineData: Step 5 - Account approved');
      }

      console.log('loadTimelineData: Final step:', step);
      setCurrentStep(step);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useFocusEffect(
    useCallback(() => {
      loadTimelineData();
    }, [loadTimelineData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTimelineData();
    setRefreshing(false);
  }, [loadTimelineData]);

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  const getStepColor = (stepId) => {
    const status = getStepStatus(stepId);
    if (status === 'completed') return COLORS.success;
    if (status === 'active') return COLORS.primary;
    return COLORS.textTertiary;
  };

  const handleUploadDocuments = () => {
    navigation.navigate('DriverDocumentUpload');
  };

  const handleViewStatus = () => {
    navigation.navigate('DriverVerificationStatus');
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Onboarding Journey</Text>
          <Text style={styles.headerSubtitle}>
            Follow these steps to complete your account setup
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep} of {STEPS.length}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const color = getStepColor(step.id);

            return (
              <View key={step.id} style={styles.timelineItem}>
                {/* Timeline dot and line */}
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: color,
                        borderColor: color,
                      },
                    ]}
                  >
                    {status === 'completed' && (
                      <Ionicons name="checkmark" size={16} color={COLORS.text} />
                    )}
                    {status === 'active' && (
                      <View style={styles.activeDot} />
                    )}
                  </View>

                  {index < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        {
                          backgroundColor:
                            status === 'completed' ? COLORS.success : COLORS.border,
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Timeline content */}
                <View style={styles.timelineContent}>
                  <View
                    style={[
                      styles.stepCard,
                      status === 'active' && styles.stepCardActive,
                    ]}
                  >
                    <View style={styles.stepHeader}>
                      <View style={styles.stepTitleContainer}>
                        <Text style={styles.stepNumber}>Step {step.id}</Text>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                      </View>
                      <Ionicons
                        name={step.icon}
                        size={24}
                        color={color}
                      />
                    </View>

                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>

                    {/* Step-specific content */}
                    {step.id === 2 && currentStep >= 2 && (
                      <View style={styles.stepContent}>
                        <Text style={styles.documentsCount}>
                          {documents.length} of 6 documents uploaded
                        </Text>
                        {documents.length > 0 && (
                          <View style={styles.documentsList}>
                            {documents.map((doc) => (
                              <View key={doc.id} style={styles.documentItem}>
                                <Ionicons
                                  name={
                                    doc.status === 'approved'
                                      ? 'checkmark-circle'
                                      : doc.status === 'rejected'
                                      ? 'close-circle'
                                      : 'time-outline'
                                  }
                                  size={16}
                                  color={
                                    doc.status === 'approved'
                                      ? COLORS.success
                                      : doc.status === 'rejected'
                                      ? COLORS.error
                                      : COLORS.warning
                                  }
                                />
                                <Text style={styles.documentName}>
                                  {documentService.getDocumentLabel(
                                    doc.document_type
                                  )}
                                </Text>
                                <Text
                                  style={[
                                    styles.documentStatus,
                                    {
                                      color:
                                        doc.status === 'approved'
                                          ? COLORS.success
                                          : doc.status === 'rejected'
                                          ? COLORS.error
                                          : COLORS.warning,
                                    },
                                  ]}
                                >
                                  {doc.status}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {step.id === 3 && currentStep >= 3 && verificationStatus && (
                      <View style={styles.stepContent}>
                        <Text style={styles.submittedDate}>
                          Submitted on{' '}
                          {new Date(
                            verificationStatus.submitted_at
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {step.id === 4 && currentStep >= 4 && (
                      <View style={styles.stepContent}>
                        <Text style={styles.reviewingText}>
                          Our admin team is reviewing your documents. This usually takes 24-48 hours.
                        </Text>
                      </View>
                    )}

                    {step.id === 5 && currentStep >= 5 && verificationStatus && (
                      <View style={styles.stepContent}>
                        <Text style={styles.approvedDate}>
                          Approved on{' '}
                          {new Date(
                            verificationStatus.verified_at
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {/* Action buttons */}
                    {status === 'active' && step.id === 2 && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleUploadDocuments}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color={COLORS.text} />
                        <Text style={styles.actionButtonText}>Upload Documents</Text>
                      </TouchableOpacity>
                    )}

                    {status === 'active' && step.id === 4 && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleViewStatus}
                      >
                        <Ionicons name="eye-outline" size={16} color={COLORS.text} />
                        <Text style={styles.actionButtonText}>View Details</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            You cannot login until your account is fully approved. Once approved, you'll receive a notification.
          </Text>
        </View>
      </ScrollView>
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
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  timelineContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  timelineLine: {
    width: 2,
    height: 80,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
  },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}08`,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  stepContent: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  documentsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  documentsList: {
    gap: 6,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentName: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
  },
  documentStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  submittedDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reviewingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  approvedDate: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
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
});

export default DriverOnboardingTimelineScreen;
