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
import { useAuth } from '../../context/AuthContext';
import * as documentService from '../../services/documentService';

const WaitingForApprovalScreen = ({ navigation }) => {
  const { signIn, signOut, session } = useAuth();
  const [driverId, setDriverId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Get current user from auth context first, fallback to supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log('WaitingForApprovalScreen: Getting current user, session user id:', session?.user?.id);
        
        // Use session from AuthContext first
        if (session?.user?.id) {
          console.log('WaitingForApprovalScreen: Setting driverId from session:', session.user.id);
          setDriverId(session.user.id);
          return;
        }
        
        // Fallback to supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('WaitingForApprovalScreen: Setting driverId from supabase:', user.id);
          setDriverId(user.id);
        } else {
          console.error('WaitingForApprovalScreen: No user found');
          Alert.alert('Error', 'User not authenticated');
          setLoading(false);
        }
      } catch (error) {
        console.error('WaitingForApprovalScreen: Error getting user:', error);
        Alert.alert('Error', 'Failed to get user information');
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, [session]);

  // Load verification status and documents
  const loadVerificationStatus = useCallback(async () => {
    if (!driverId) {
      console.log('loadVerificationStatus: No driverId yet, skipping');
      return;
    }

    try {
      setLoading(true);
      console.log('loadVerificationStatus: Loading for driver:', driverId);

      // Add timeout protection for both queries
      const statusPromise = documentService.getDriverVerificationStatus(driverId);
      const docsPromise = documentService.getDriverAllDocuments(driverId);
      
      const statusTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Status loading timeout')), 15000)
      );
      const docsTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Documents loading timeout')), 15000)
      );
      
      const [status, docs] = await Promise.all([
        Promise.race([statusPromise, statusTimeoutPromise]),
        Promise.race([docsPromise, docsTimeoutPromise]),
      ]);
      
      console.log('loadVerificationStatus: Status:', status);
      console.log('loadVerificationStatus: Docs count:', docs?.length);
      
      setVerificationStatus(status);
      setDocuments(docs || []);

      // CHECK IF APPROVED - log it for debugging
      if (status?.overall_status === 'approved') {
        console.log('✅ WaitingForApprovalScreen: Driver is approved (DriverNavigator should handle navigation)');
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      Alert.alert('Error', 'Failed to load approval status: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useFocusEffect(
    useCallback(() => {
      // Load status only once when screen is focused
      loadVerificationStatus();
      
      // Subscribe to real-time changes in driver_verification_status table
      // This way, when admin approves the driver, we'll be notified
      if (!driverId) {
        return () => {};
      }

      console.log('WaitingForApprovalScreen: Setting up real-time subscription for driver:', driverId);

      const subscription = supabase
        .channel(`verification-status:${driverId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'driver_verification_status',
            filter: `driver_id=eq.${driverId}`,
          },
          (payload) => {
            console.log('🔔 Real-time update received:', payload);
            const newStatus = payload.new?.overall_status;
            
            // If status changed to approved, reload and let DriverNavigator handle the transition
            if (newStatus === 'approved') {
              console.log('✅ Driver approved in real-time! Reloading status...');
              loadVerificationStatus();
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        console.log('WaitingForApprovalScreen: Unsubscribing from real-time updates');
        supabase.removeChannel(subscription);
      };
    }, [driverId, loadVerificationStatus])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVerificationStatus();
    setRefreshing(false);
  }, [loadVerificationStatus]);

  const handleCheckStatus = async () => {
    // Just refresh the data once, don't start polling
    setCheckingApproval(true);
    await loadVerificationStatus();
    setCheckingApproval(false);
  };

  const handleReUpload = () => {
    navigation.navigate('UploadDocuments');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await signOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
              setLoggingOut(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const isRejected = verificationStatus?.overall_status === 'rejected';
  const rejectedDocs = documents.filter(d => d.status === 'rejected');
  const approvedDocs = documents.filter(d => d.status === 'approved');
  const pendingDocs = documents.filter(d => d.status === 'pending_review' || d.status === 'pending');

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header - changes based on status */}
        <View style={[styles.header, isRejected && styles.headerRejected]}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, isRejected && styles.iconContainerRejected]}>
              <Ionicons
                name={isRejected ? 'close-circle-outline' : 'hourglass-outline'}
                size={48}
                color={isRejected ? COLORS.error : COLORS.warning}
              />
            </View>
            <Text style={styles.headerTitle}>
              {isRejected ? 'Documents Rejected' : 'Waiting for Approval'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isRejected
                ? 'Some documents were rejected. Please re-upload and resubmit.'
                : 'Your documents have been submitted and are under review.'}
            </Text>
          </View>
        </View>

        {/* Document Status List */}
        {documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Status</Text>

            {/* Rejected documents - shown prominently */}
            {rejectedDocs.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>⚠️ Rejected - Action Required</Text>
                {rejectedDocs.map((doc, index) => (
                  <View key={`rejected-${doc.document_type}-${index}`} style={styles.docRow}>
                    <View style={[styles.docStatusDot, { backgroundColor: COLORS.error }]} />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{documentService.getDocumentLabel(doc.document_type)}</Text>
                      {doc.rejection_reason ? (
                        <Text style={styles.rejectionReason}>Reason: {doc.rejection_reason}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
                  </View>
                ))}
              </>
            )}

            {/* Pending documents */}
            {pendingDocs.length > 0 && (
              <>
                <Text style={[styles.subSectionTitle, { marginTop: 12 }]}>⏳ Pending Review</Text>
                {pendingDocs.map((doc, index) => (
                  <View key={`pending-${doc.document_type}-${index}`} style={styles.docRow}>
                    <View style={[styles.docStatusDot, { backgroundColor: COLORS.warning }]} />
                    <Text style={styles.docName}>{documentService.getDocumentLabel(doc.document_type)}</Text>
                    <Ionicons name="time-outline" size={20} color={COLORS.warning} />
                  </View>
                ))}
              </>
            )}

            {/* Approved documents */}
            {approvedDocs.length > 0 && (
              <>
                <Text style={[styles.subSectionTitle, { marginTop: 12 }]}>✅ Approved</Text>
                {approvedDocs.map((doc, index) => (
                  <View key={`approved-${doc.document_type}-${index}`} style={styles.docRow}>
                    <View style={[styles.docStatusDot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.docName}>{documentService.getDocumentLabel(doc.document_type)}</Text>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Overall Status</Text>
            <View style={[styles.statusBadge, isRejected && styles.statusBadgeRejected]}>
              <View style={[styles.statusDot, { backgroundColor: isRejected ? COLORS.error : COLORS.warning }]} />
              <Text style={[styles.statusBadgeText, isRejected && { color: COLORS.error }]}>
                {isRejected ? 'Rejected' : 'Pending Review'}
              </Text>
            </View>
          </View>

          <View style={styles.statusDetails}>
            <View style={styles.statusItem}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.statusItemContent}>
                <Text style={styles.statusItemLabel}>Submitted</Text>
                <Text style={styles.statusItemValue}>
                  {verificationStatus?.submitted_at
                    ? new Date(verificationStatus.submitted_at).toLocaleDateString()
                    : 'Today'}
                </Text>
              </View>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.statusItemContent}>
                <Text style={styles.statusItemLabel}>{isRejected ? 'Action Required' : 'Expected Review Time'}</Text>
                <Text style={styles.statusItemValue}>{isRejected ? 'Re-upload rejected docs' : '24-48 hours'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info box */}
        <View style={[styles.infoBox, isRejected && styles.infoBoxRejected]}>
          <Ionicons
            name={isRejected ? 'alert-circle-outline' : 'information-circle-outline'}
            size={20}
            color={isRejected ? COLORS.error : COLORS.info}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{isRejected ? 'What to do next' : 'What happens next?'}</Text>
            <Text style={styles.infoText}>
              {isRejected
                ? 'Tap "Re-upload Documents" below to fix the rejected documents. Make sure images are clear and all details are visible. Then resubmit for review.'
                : 'Our admin team will review your documents. Once approved, you\'ll be able to start accepting trips.'}
            </Text>
          </View>
        </View>

        {/* Buttons Row - Inside ScrollView */}
        <View style={styles.buttonsRow}>
          {isRejected ? (
            <TouchableOpacity style={styles.reUploadButton} onPress={handleReUpload}>
              <Ionicons name="cloud-upload-outline" size={18} color={COLORS.text} />
              <Text style={styles.reUploadButtonText}>Re-upload Documents</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheckStatus}
              disabled={checkingApproval}
            >
              {checkingApproval ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.checkButtonText}>Check Status</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Empty Footer */}
      <View style={styles.footer}>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingVertical: 32,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  headerRejected: { backgroundColor: `${COLORS.error}10` },
  headerContent: { alignItems: 'center' },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${COLORS.warning}15`,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  iconContainerRejected: { backgroundColor: `${COLORS.error}15` },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  section: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  subSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  docRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 10,
  },
  docStatusDot: { width: 10, height: 10, borderRadius: 5 },
  docInfo: { flex: 1 },
  docName: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  rejectionReason: { fontSize: 11, color: COLORS.error, marginTop: 2 },
  statusCard: {
    marginHorizontal: 16, marginVertical: 16,
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6,
  },
  statusBadgeRejected: { backgroundColor: `${COLORS.error}15` },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.warning },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.warning },
  statusDetails: { gap: 12 },
  statusItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusItemContent: { flex: 1 },
  statusItemLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  statusItemValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: `${COLORS.info}15`, borderRadius: 8, padding: 12,
    marginHorizontal: 16, marginVertical: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.info, gap: 12,
  },
  infoBoxRejected: { backgroundColor: `${COLORS.error}10`, borderLeftColor: COLORS.error },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  infoText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  buttonsRow: {
    paddingHorizontal: 16, paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
  },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8,
  },
  checkButton: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 8, paddingVertical: 12, gap: 8,
  },
  checkButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  reUploadButton: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.error, borderRadius: 8, paddingVertical: 14, gap: 8,
  },
  reUploadButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  logoutButton: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 8, paddingVertical: 12, gap: 8,
  },
  logoutButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
});

export default WaitingForApprovalScreen;
