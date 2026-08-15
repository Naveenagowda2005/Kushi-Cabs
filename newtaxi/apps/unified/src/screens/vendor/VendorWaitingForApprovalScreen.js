import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

const VendorWaitingForApprovalScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const previousStateRef = React.useRef({});
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Animation for pulsing icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Load verification status
  const loadVerificationStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('loadVerificationStatus: Fetching status for user:', user.id);
      
      const { data, error } = await supabase
        .from('vendor_verification_status')
        .select('overall_status, submitted_at, rejection_reason, approved_at')
        .eq('user_id', user.id)
        .single();

      if (error?.code === 'PGRST116') {
        console.log('loadVerificationStatus: No status record found (PGRST116)');
        setVerificationStatus(null);
        return;
      }

      if (error) {
        console.error('loadVerificationStatus: Error fetching status:', error);
        throw error;
      }

      console.log('loadVerificationStatus: Status data:', JSON.stringify(data));
      setVerificationStatus(data);

      // Check if approved and trigger alert
      if (data?.overall_status === 'approved' && !previousStateRef.current.approvalShown) {
        previousStateRef.current.approvalShown = true;
        console.log('✅ APPROVED DETECTED - Showing approval alert');

        Alert.alert(
          'Approved! 🎉',
          'Your account has been approved by the admin. You can now access all features.',
          [
            {
              text: 'Continue',
              onPress: () => {
                console.log('loadVerificationStatus: User clicked Continue - VendorNavigator will re-render');
                // VendorNavigator polls every 4s and will detect the approved status,
                // re-rendering the tab navigator automatically. No explicit navigation needed.
              },
            },
          ]
        );
        return;
      }

      // Fetch documents to check for rejections
      console.log('loadVerificationStatus: Fetching documents');
      const { data: vendorDocs, error: docsError } = await supabase
        .from('vendor_documents')
        .select('documents')
        .eq('user_id', user.id)
        .single();

      if (docsError?.code === 'PGRST116') {
        console.log('loadVerificationStatus: No vendor documents found');
        return;
      }

      if (docsError) {
        console.log('loadVerificationStatus: Error fetching documents:', docsError);
      }

      console.log('loadVerificationStatus: Documents retrieved:', vendorDocs ? 'found' : 'none');

      if (vendorDocs?.documents) {
        // Check for any rejected documents
        const rejectedDocs = Object.entries(vendorDocs.documents)
          .filter(([_, doc]) => doc?.status === 'rejected')
          .map(([type, doc]) => ({
            type,
            reason: doc?.rejection_reason || 'Not specified',
          }));

        console.log('⚠️ Rejected Docs:', rejectedDocs);

        if (rejectedDocs.length > 0 && !previousStateRef.current.rejectionShown) {
          // Show alert for first rejected document (only once per rejection)
          const rejectedDoc = rejectedDocs[0];
          console.log('✅ Showing rejection alert for:', rejectedDoc.type);
          previousStateRef.current.rejectionShown = true;
          
          Alert.alert(
            '⚠️ Document Rejected',
            `Your ${getDocumentLabel(rejectedDoc.type)} was rejected.\n\nReason: ${rejectedDoc.reason}\n\nPlease re-upload the document.`,
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('UploadDocuments'),
              },
            ]
          );
        } else if (rejectedDocs.length === 0 && previousStateRef.current.rejectionShown) {
          // Clear rejection flag if all documents are no longer rejected (user re-uploaded)
          previousStateRef.current.rejectionShown = false;
        }
      }
    } catch (error) {
      console.error('loadVerificationStatus: Error:', error);
    }
  }, [user?.id, navigation]);

  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus, do an immediate check
      console.log('🔄 VendorWaitingForApprovalScreen focused - doing immediate status check');
      setLoading(true);
      loadVerificationStatus().finally(() => setLoading(false));
      
      // Set up real-time listener for this screen
      // IMPORTANT: Add callback BEFORE subscribe, not after
      let isMounted = true;
      let channel;
      
      try {
        channel = supabase
          .channel(`waiting_screen_vvs_${user?.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vendor_verification_status',
              filter: `user_id=eq.${user?.id}`,
            },
            (payload) => {
              if (isMounted && payload.new) {
                console.log('🔔 WaitingForApprovalScreen: Real-time update received:', JSON.stringify(payload.new));
                loadVerificationStatus();
              }
            }
          )
          .subscribe((status) => {
            console.log('WaitingForApprovalScreen: Real-time listener status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('WaitingForApprovalScreen: ✅ Real-time listener ACTIVE');
            }
          });
      } catch (error) {
        console.error('WaitingForApprovalScreen: Real-time setup error:', error);
      }
      
      // Poll for status changes every 5 seconds (as backup to real-time)
      const interval = setInterval(() => {
        if (isMounted) {
          console.log('📡 WaitingForApprovalScreen: Polling for status changes...');
          loadVerificationStatus();
        }
      }, 5000);

      return () => {
        console.log('⏸️ WaitingForApprovalScreen: Cleaning up listeners');
        isMounted = false;
        clearInterval(interval);
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }, [user?.id, loadVerificationStatus])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVerificationStatus();
    setRefreshing(false);
  }, [loadVerificationStatus]);

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

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.iconBg, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
              <Ionicons name="hourglass-outline" size={64} color={COLORS.vendor.primary} />
            </View>
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: COLORS.text }]}>Verification in Progress</Text>

        {/* Description */}
        <View style={[styles.descriptionContainer, { backgroundColor: COLORS.surface }]}>
          <Text style={[styles.descriptionText, { color: COLORS.textSecondary }]}>
            Your documents have been successfully submitted for verification. Our admin team will review your application and get back to you within 24-48 hours.
          </Text>
        </View>

        {/* Status Timeline */}
        <View style={styles.timelineContainer}>
          {/* Step 1: Documents Submitted */}
          <View style={styles.timelineStep}>
            <View style={[styles.stepCircle, styles.stepComplete]}>
              <Ionicons name="checkmark" size={24} color="#fff" />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: COLORS.text }]}>Documents Submitted</Text>
              <Text style={[styles.stepDate, { color: COLORS.textTertiary }]}>
                {verificationStatus?.submitted_at
                  ? new Date(verificationStatus.submitted_at).toLocaleString()
                  : 'Just now'}
              </Text>
            </View>
          </View>

          {/* Connector */}
          <View style={[styles.connector, { backgroundColor: COLORS.border }]} />

          {/* Step 2: Under Review */}
          <View style={styles.timelineStep}>
            <View style={[styles.stepCircle, styles.stepActive]}>
              <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
                <View style={styles.spinnerDot} />
              </Animated.View>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: COLORS.text }]}>Under Review</Text>
              <Text style={[styles.stepDate, { color: COLORS.textTertiary }]}>Our team is reviewing your documents</Text>
            </View>
          </View>

          {/* Connector */}
          <View style={[styles.connector, { backgroundColor: COLORS.border }]} />

          {/* Step 3: Approval */}
          <View style={styles.timelineStep}>
            <View style={[styles.stepCircle, styles.stepPending, { backgroundColor: COLORS.surface }]}>
              <Ionicons name="checkmark" size={24} color={COLORS.vendor.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: COLORS.text }]}>Verification Complete</Text>
              <Text style={[styles.stepDate, { color: COLORS.textTertiary }]}>You'll be notified when approved</Text>
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: COLORS.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.vendor.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.infoTitle, { color: COLORS.text }]}>What happens next?</Text>
            <Text style={[styles.infoText, { color: COLORS.textSecondary }]}>
              Our admin team will carefully review all your submitted documents. You'll receive an email notification once your account is approved or if we need any additional information.
            </Text>
          </View>
        </View>

        {/* Tips Box */}
        <View style={[styles.tipsBox, { backgroundColor: COLORS.surface }]}>
          <Text style={[styles.tipsTitle, { color: COLORS.text }]}>Helpful Tips</Text>
          <Text style={[styles.tipItem, { color: COLORS.textSecondary }]}>• Keep your documents clear and legible</Text>
          <Text style={[styles.tipItem, { color: COLORS.textSecondary }]}>• Ensure proper lighting in your selfie</Text>
          <Text style={[styles.tipItem, { color: COLORS.textSecondary }]}>• Have all document information visible</Text>
          <Text style={[styles.tipItem, { color: COLORS.textSecondary }]}>• Response time: Usually 24-48 hours</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: COLORS.background, borderTopColor: COLORS.border }]}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => navigation.navigate('UploadDocuments')}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.uploadBtnText}>Upload Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.refreshBtn, checkingStatus && styles.refreshBtnDisabled, { borderColor: COLORS.vendor.primary, backgroundColor: COLORS.surface }]}
          onPress={async () => {
            console.log('🔄 Manual refresh button pressed');
            setCheckingStatus(true);
            try {
              await loadVerificationStatus();
            } finally {
              setCheckingStatus(false);
            }
          }}
          disabled={checkingStatus}
        >
          {checkingStatus ? (
            <>
              <ActivityIndicator size="small" color={COLORS.vendor.primary} />
              <Text style={[styles.refreshBtnText, { color: COLORS.vendor.primary }]}>Checking...</Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={20} color={COLORS.vendor.primary} />
              <Text style={[styles.refreshBtnText, { color: COLORS.vendor.primary }]}>Check Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactBtn, { backgroundColor: COLORS.surface }]}
          onPress={() => {
            Alert.alert(
              'Contact Support',
              'Email: support@kushicabs.com\nPhone: +91-XXXX-XXXX-XXXX\n\nWe\'re here to help!'
            );
          }}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.vendor.primary} />
          <Text style={[styles.contactBtnText, { color: COLORS.vendor.primary }]}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: COLORS.surface }]}
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => signOut(),
              },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  descriptionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  timelineContainer: {
    marginBottom: 24,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  stepCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepComplete: {
    backgroundColor: '#4caf50',
  },
  stepActive: {
    backgroundColor: COLORS.vendor.primary,
  },
  stepPending: {
    borderWidth: 1,
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  connector: {
    width: 2,
    height: 20,
    marginLeft: 24,
    marginBottom: 0,
  },
  stepContent: {
    justifyContent: 'center',
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDate: {
    fontSize: 12,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  tipsBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 12,
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
  },
  uploadBtn: {
    backgroundColor: COLORS.vendor.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshBtn: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  refreshBtnDisabled: {
    opacity: 0.6,
  },
  refreshBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactBtn: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signOutBtn: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutBtnText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VendorWaitingForApprovalScreen;
