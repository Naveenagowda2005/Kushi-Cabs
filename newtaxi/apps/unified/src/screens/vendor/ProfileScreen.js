import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { supabase } from '../../lib/supabase';
import * as documentService from '../../services/documentService';
import { API_CONFIG } from '../../constants';
import IDCard from '../../components/IDCard';

const REQUIRED_DOCS = ['AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE'];

const DOC_CONFIG = {
  AADHAR:              { label: 'Aadhar Card',           icon: 'card-outline' },
  PAN_CARD:            { label: 'PAN Card',              icon: 'card-outline' },
  BANK_PASSBOOK_FRONT: { label: 'Bank Passbook (Front)', icon: 'book-outline' },
  VENDOR_SELFIE:       { label: 'Selfie with Aadhar',   icon: 'person-circle-outline' },
};

const STATUS_CONFIG = {
  approved: { color: '#4caf50', icon: 'checkmark-circle', label: 'Approved' },
  rejected: { color: '#ef5350', icon: 'close-circle',     label: 'Rejected' },
  pending:  { color: '#ff9800', icon: 'time',             label: 'Pending Review' },
};

function useVendorWallet(userId) {
  const [wallet, setWallet] = useState(null);
  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
    setWallet(data);
  }, [userId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { wallet };
}

export default function VendorProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { wallet } = useVendorWallet(user?.id);
  const { vendor } = useVendorProfile(user?.id);
  const [commissionValue, setCommissionValue] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [updatingDoc, setUpdatingDoc] = useState(null); // doc type being re-uploaded
  const [showIDCard, setShowIDCard] = useState(false);

  // Fetch commission
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('vendor_commission_value')
          .eq('id', 'global')
          .maybeSingle();
        if (data?.vendor_commission_value) setCommissionValue(data.vendor_commission_value);
      } catch (error) {
        console.error('Error fetching commission:', error);
      }
    };
    fetchCommission();
  }, []);

  // Load vendor documents — also sets avatar from VENDOR_SELFIE
  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setDocsLoading(true);
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('documents')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const docMap = data?.documents || {};
      const docList = REQUIRED_DOCS.map((type) => ({
        type,
        label: DOC_CONFIG[type].label,
        icon: DOC_CONFIG[type].icon,
        status: docMap[type]?.status || 'pending',
        document_data: docMap[type]?.document_data || null,
        rejection_reason: docMap[type]?.rejection_reason || null,
        uploaded_at: docMap[type]?.uploaded_at || null,
      }));
      setDocuments(docList);

      // Use VENDOR_SELFIE as profile photo — it's the source of truth
      const selfieData = docMap['VENDOR_SELFIE']?.document_data;
      if (selfieData) {
        const uri = selfieData.startsWith('data:')
          ? selfieData
          : `data:image/jpeg;base64,${selfieData}`;
        setAvatarBase64(uri);
      }
    } catch (e) {
      console.error('Error loading vendor documents:', e);
    } finally {
      setDocsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadDocuments(); }, [loadDocuments]));

  // ── Re-upload a single document ─────────────────────────────────────────
  const handleUpdateDocument = (doc) => {
    const isSelfie = doc.type === 'VENDOR_SELFIE';
    Alert.alert(
      `Update ${doc.label}`,
      'Choose source',
      [
        { text: isSelfie ? 'Take Selfie' : 'Camera',       onPress: () => pickAndUploadDoc(doc.type, true) },
        ...(!isSelfie ? [{ text: 'Photo Library', onPress: () => pickAndUploadDoc(doc.type, false) }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickAndUploadDoc = async (docType, useCamera) => {
    try {
      setUpdatingDoc(docType);
      const imageData = await documentService.pickDocumentImage(useCamera);
      if (!imageData) return;

      // Fetch existing vendor_documents record
      const { data: existingDocs, error: fetchError } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentDocs = existingDocs?.documents || {};
      // Reset this document to pending — requires admin re-review
      currentDocs[docType] = {
        status: 'pending',
        document_data: imageData.base64,
        uploaded_at: new Date().toISOString(),
        rejection_reason: null, // clear any old rejection reason
      };

      if (existingDocs) {
        const { error: updateError } = await supabase
          .from('vendor_documents')
          .update({ documents: currentDocs, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        // No record yet — need vendor_id
        const { data: vendorRow } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const { error: insertError } = await supabase
          .from('vendor_documents')
          .insert({ user_id: user.id, vendor_id: vendorRow?.id, documents: currentDocs });
        if (insertError) throw insertError;
      }

      // ── Reset overall verification status to 'pending' so admin re-reviews ──
      // This makes the vendor appear in admin's Pending tab again
      const { error: resetError } = await supabase
        .rpc('reset_vendor_to_pending', { p_user_id: user.id });

      if (resetError) {
        // RPC might not exist yet — fallback to direct update (RLS is disabled)
        console.warn('reset_vendor_to_pending RPC failed, trying direct update:', resetError.message);
        await supabase
          .from('vendor_verification_status')
          .update({
            overall_status: 'pending',
            all_documents_submitted: true,
            submitted_at: new Date().toISOString(),
            approved_at: null,
            rejected_at: null,
            rejection_reason: null,
            is_re_verification: true,   // vendor keeps dashboard access
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        console.log('reset_vendor_to_pending: VVS reset to pending ✅');
      }

      await loadDocuments();

      Alert.alert(
        'Document Updated',
        `${DOC_CONFIG[docType].label} has been re-uploaded and sent for admin review.\n\nYour account will remain active while the document is being reviewed.`
      );
    } catch (err) {
      console.error('Re-upload error:', err);
      Alert.alert('Error', err.message || 'Failed to update document');
    } finally {
      setUpdatingDoc(null);
    }
  };

  const menuItems = [
    { icon: 'bar-chart-outline',      label: 'Earnings & Reports',  onPress: () => navigation.navigate('Earnings') },
    { icon: 'document-text-outline',  label: 'Privacy Policy',      onPress: () => navigation.navigate('ViewPolicy', { policyType: 'privacy_policy' }) },
    { icon: 'document-text-outline',  label: 'Terms & Conditions',  onPress: () => navigation.navigate('ViewPolicy', { policyType: 'terms_conditions' }) },
    { icon: 'close-circle-outline',   label: 'Cancellation Policy', onPress: () => navigation.navigate('ViewPolicy', { policyType: 'cancellation_policy' }) },
    { icon: 'cash-outline',           label: 'Refund Policy',       onPress: () => navigation.navigate('ViewPolicy', { policyType: 'refund_policy' }) },
    { icon: 'warning-outline',        label: 'Safety Guidelines',   onPress: () => navigation.navigate('ViewPolicy', { policyType: 'safety_guidelines' }) },
  ];

  const avatarSource = avatarBase64 ? { uri: avatarBase64 } : null;
  const approvedCount = documents.filter(d => d.status === 'approved').length;

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              '⚠️ Confirm Deletion',
              'Are you absolutely sure? You cannot recover this account.',
              [
                { text: 'No, Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Permanently',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/delete-user`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: user.id,
                          phone: user.phone,
                          email: `${user.phone}@kushicabs.phone`
                        })
                      });

                      const result = await response.json();

                      if (!response.ok) {
                        throw new Error(result.error || result.message || 'Failed to delete account');
                      }

                      Alert.alert(
                        '✅ Account Deleted',
                        'Your account has been successfully deleted.',
                        [{ text: 'OK', onPress: () => signOut() }]
                      );
                    } catch (err) {
                      console.error('Delete account error:', err);
                      Alert.alert('Error', err.message || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header with Settings */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsBtn}
          onPress={() => {
            Alert.alert(
              'Settings',
              'What would you like to do?',
              [
                { text: 'Delete Account', style: 'destructive', onPress: () => handleDeleteAccount() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Avatar — sourced from VENDOR_SELFIE document */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatarContainer}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.full_name?.charAt(0)?.toUpperCase() ?? 'V'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.full_name || 'Vendor'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        {vendor?.company_name && <Text style={styles.company}>{vendor.company_name}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Vendor</Text>
        </View>

        {/* ID Card Button */}
        <TouchableOpacity 
          style={styles.idCardButton}
          onPress={() => setShowIDCard(true)}
        >
          <Ionicons name="card" size={16} color="#fff" />
          <Text style={styles.idCardButtonText}>View ID Card</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet */}
      {wallet && (
        <View style={styles.balanceCard}>
          <Ionicons name="wallet-outline" size={20} color="#4caf50" />
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceAmount}>₹{wallet.balance?.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Documents Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setDocsExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={18} color="#e94560" />
            <Text style={styles.sectionTitle}>My Documents</Text>
            {approvedCount > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{approvedCount}/{REQUIRED_DOCS.length} approved</Text>
              </View>
            )}
          </View>
          <Ionicons name={docsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
        </TouchableOpacity>

        {docsExpanded && (
          <>
            {docsLoading ? (
              <ActivityIndicator color="#e94560" style={{ paddingVertical: 16 }} />
            ) : (
              documents.map((doc) => {
                const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
                const hasData = !!doc.document_data;

                return (
                  <View key={doc.type} style={styles.docRow}>
                    {/* Icon — tap to preview */}
                    <TouchableOpacity
                      style={[styles.docIcon, { backgroundColor: cfg.color + '20' }]}
                      onPress={() => hasData && setPreviewDoc(doc)}
                      disabled={!hasData}
                    >
                      <Ionicons name={doc.icon} size={20} color={cfg.color} />
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{doc.label}</Text>
                      {doc.status === 'rejected' && doc.rejection_reason ? (
                        <Text style={styles.docRejection} numberOfLines={1}>⚠️ {doc.rejection_reason}</Text>
                      ) : doc.status === 'pending' && doc.document_data ? (
                        <Text style={styles.docPending}>⏳ Awaiting admin review</Text>
                      ) : (
                        <Text style={styles.docDate}>
                          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Not uploaded'}
                        </Text>
                      )}
                    </View>

                    {/* Status badge */}
                    <View style={styles.docStatus}>
                      <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                      <Text style={[styles.docStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>

                    {/* Re-upload button */}
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={() => handleUpdateDocument(doc)}
                      disabled={updatingDoc === doc.type}
                    >
                      {updatingDoc === doc.type
                        ? <ActivityIndicator size="small" color="#fff" style={{ width: 34 }} />
                        : <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                      }
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color="#aaa" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color="#ef5350" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* ID Card Modal */}
      <Modal visible={showIDCard} transparent animationType="fade" onRequestClose={() => setShowIDCard(false)}>
        <View style={styles.idCardModalOverlay}>
          <View style={styles.idCardModalBox}>
            <TouchableOpacity 
              style={styles.idCardCloseBtn}
              onPress={() => setShowIDCard(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.idCardModalContent} showsVerticalScrollIndicator={false}>
              <IDCard 
                userType="vendor"
                fullName={user?.full_name}
                phone={user?.phone}
                photo={avatarBase64}
                companyName={vendor?.company_name}
                serialNumber={vendor?.id?.charCodeAt(0) || 12345}
                isApproved={documents.some(d => d.status === 'approved')}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={!!previewDoc} transparent animationType="fade" onRequestClose={() => setPreviewDoc(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{previewDoc?.label}</Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {previewDoc && (() => {
              const cfg = STATUS_CONFIG[previewDoc.status] || STATUS_CONFIG.pending;
              return (
                <View style={[styles.modalStatusBadge, { backgroundColor: cfg.color + '25', borderColor: cfg.color }]}>
                  <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                  <Text style={[styles.modalStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              );
            })()}

            {previewDoc?.rejection_reason && (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                <Text style={styles.rejectionText}>{previewDoc.rejection_reason}</Text>
              </View>
            )}

            {previewDoc?.document_data ? (
              <Image
                source={{ uri: previewDoc.document_data.startsWith('data:')
                  ? previewDoc.document_data
                  : `data:image/jpeg;base64,${previewDoc.document_data}` }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noPreview}>
                <Ionicons name="document-outline" size={48} color="#555" />
                <Text style={styles.noPreviewText}>No preview available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  headerTitle: { color: '#333', fontSize: 18, fontWeight: '600' },
  settingsBtn: { padding: 8 },
  
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  scroll: { padding: 16, paddingTop: 20, paddingBottom: 40 },

  // Avatar
  avatarWrap: { alignItems: 'center', marginBottom: 24, backgroundColor: '#ffffff', borderRadius: 14, padding: 20 },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#ff9800' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#ff9800' },
  avatarText: { color: '#333', fontSize: 36, fontWeight: 'bold' },
  name: { color: '#333', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  phone: { color: '#888', fontSize: 14, marginBottom: 4 },
  userId: { color: '#aaa', fontSize: 10, marginBottom: 8, fontFamily: 'monospace' },
  company: { color: '#666', fontSize: 13, marginBottom: 8 },
  roleBadge: { backgroundColor: '#ff980020', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#ff9800', alignItems: 'center' },
  roleText: { color: '#ff9800', fontSize: 12, fontWeight: '600' },
  commissionText: { color: '#ff9800', fontSize: 10, marginTop: 3 },

  idCardButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9c27b0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  idCardButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  idCardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  idCardModalBox: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },

  idCardCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 8,
  },

  idCardModalContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },

  // Wallet
  balanceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 14, padding: 8, marginBottom: 12, borderWidth: 2, borderColor: '#ff9800' },
  balanceLabel: { color: '#888', fontSize: 11, marginBottom: 0 },
  balanceAmount: { color: '#4caf50', fontSize: 18, fontWeight: 'bold' },

  // Documents section
  section: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: '#ff9800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#333', fontSize: 16, fontWeight: '700' },
  sectionBadge: { backgroundColor: '#4caf5030', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeText: { color: '#4caf50', fontSize: 11, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', gap: 12, marginTop: 4 },
  docIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docName: { color: '#333', fontSize: 13, fontWeight: '500', marginBottom: 2 },
  docDate: { color: '#888', fontSize: 11 },
  docRejection: { color: '#ef5350', fontSize: 11 },
  docPending: { color: '#ff9800', fontSize: 11 },
  docStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docStatusText: { fontSize: 11, fontWeight: '600' },
  updateBtn: {
    backgroundColor: '#1565c0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
  },

  // Menu
  menu: { backgroundColor: '#ffffff', borderRadius: 14, marginBottom: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#ff9800' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  menuLabel: { color: '#333', fontSize: 15, flex: 1 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#ef5350' },
  signOutText: { color: '#ef5350', fontSize: 16, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: 16, width: '100%', maxHeight: '85%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: '#333', fontSize: 16, fontWeight: '700', flex: 1 },
  modalStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  modalStatusText: { fontSize: 12, fontWeight: '600' },
  rejectionBox: { backgroundColor: '#ef535015', borderLeftWidth: 3, borderLeftColor: '#ef5350', borderRadius: 6, padding: 10, marginBottom: 10 },
  rejectionLabel: { color: '#ef5350', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  rejectionText: { color: '#333', fontSize: 12 },
  previewImage: { width: '100%', height: 320, borderRadius: 10, backgroundColor: '#f5f5f5' },
  noPreview: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noPreviewText: { color: '#888', fontSize: 13 },
});
