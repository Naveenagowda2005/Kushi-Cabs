import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import * as documentService from '../../services/documentService';
import { API_CONFIG } from '../../constants';
import IDCard from '../../components/IDCard';

const STATUS_CONFIG = {
  approved:       { color: '#4caf50', icon: 'checkmark-circle',  label: 'Approved' },
  rejected:       { color: '#ef5350', icon: 'close-circle',      label: 'Rejected' },
  pending_review: { color: '#ff9800', icon: 'time',              label: 'Under Review' },
  pending:        { color: '#ff9800', icon: 'time',              label: 'Under Review' },
};

export default function DriverProfileScreen({ navigation }) {
  const { user, refreshUserProfile, signOut } = useAuth();
  const [uploading, setUploading]     = useState(false);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [documents, setDocuments]     = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [previewDoc, setPreviewDoc]     = useState(null); // {label, data, mime}
  const [updatingDoc, setUpdatingDoc]   = useState(null); // documentType being updated
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [driverProfile, setDriverProfile] = useState(null);
  const [showIDCard, setShowIDCard] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // Fallback user info from database

  // Load user info from database if not in AuthContext
  useEffect(() => {
    if (!user?.id) return;
    if (user?.full_name) {
      setUserInfo(user); // Use user from AuthContext
      return;
    }
    
    // Fallback: fetch from database if AuthContext doesn't have full_name
    const fetchUserInfo = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, phone, email')
          .eq('id', user.id)
          .single();
        setUserInfo(data || user);
      } catch (e) {
        console.error('Error loading user info:', e);
        setUserInfo(user);
      }
    };
    fetchUserInfo();
  }, [user?.id, user?.full_name]);

  // Load avatar
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('users').select('avatar_base64').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.avatar_base64) setAvatarBase64(data.avatar_base64); });
  }, [user?.id]);

  // Load driver profile details
  useEffect(() => {
    if (!user?.id) return;
    const fetchDriverProfile = async () => {
      try {
        const { data } = await supabase
          .from('drivers')
          .select('id, license_number, vehicle_number')
          .eq('user_id', user.id)
          .maybeSingle();
        setDriverProfile(data);
      } catch (e) {
        console.error('Error loading driver profile:', e);
      }
    };
    fetchDriverProfile();
  }, [user?.id]);

  // Load documents on every focus
  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setDocsLoading(true);
      const docs = await documentService.getDriverAllDocuments(user.id);
      setDocuments(docs || []);

      // Use DRIVER_SELFIE as profile photo if no custom avatar set
      const selfie = docs?.find(d => d.document_type === 'DRIVER_SELFIE' && d.document_url);
      if (selfie) {
        // Only set if user hasn't manually set their own avatar
        supabase.from('users').select('avatar_base64').eq('id', user.id).maybeSingle()
          .then(({ data }) => {
            if (data?.avatar_base64) {
              setAvatarBase64(data.avatar_base64); // user's custom photo takes priority
            } else {
              // Fall back to selfie document URL from storage
              setAvatarBase64(selfie.document_url);
            }
          });
      }
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      setDocsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadDocuments(); }, [loadDocuments]));

  const menuItems = [
    { icon: 'document-text-outline', label: 'Privacy Policy', onPress: () => navigation.navigate('ViewPolicy', { policyType: 'privacy_policy' }) },
    { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: () => navigation.navigate('ViewPolicy', { policyType: 'terms_conditions' }) },
    { icon: 'close-circle-outline', label: 'Cancellation Policy', onPress: () => navigation.navigate('ViewPolicy', { policyType: 'cancellation_policy' }) },
    { icon: 'cash-outline', label: 'Refund Policy', onPress: () => navigation.navigate('ViewPolicy', { policyType: 'refund_policy' }) },
    { icon: 'warning-outline', label: 'Safety Guidelines', onPress: () => navigation.navigate('ViewPolicy', { policyType: 'safety_guidelines' }) },
  ];

  // ── Update a single document inline ──────────────────────────────────────
  const handleUpdateDocument = async (doc) => {
    const isSelfie = doc.document_type === 'DRIVER_SELFIE';
    Alert.alert(
      `Update ${documentService.getDocumentLabel(doc.document_type)}`,
      'Choose source',
      [
        { text: isSelfie ? 'Take Selfie' : 'Camera', onPress: () => pickAndUpload(doc.document_type, true) },
        ...(!isSelfie ? [{ text: 'Photo Library', onPress: () => pickAndUpload(doc.document_type, false) }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickAndUpload = async (documentType, useCamera) => {
    try {
      setUpdatingDoc(documentType);
      const imageData = await documentService.pickDocumentImage(useCamera);
      if (!imageData) return;
      await documentService.uploadDocumentImage(user.id, documentType, imageData);
      if (documentType === 'DRIVER_SELFIE') setAvatarBase64(null); // force reload
      await loadDocuments();
      Alert.alert('Updated', `${documentService.getDocumentLabel(documentType)} updated successfully`);
    } catch (err) {
      console.error('Update doc error:', err);
      Alert.alert('Error', err.message || 'Failed to update document');
    } finally {
      setUpdatingDoc(null);
    }
  };

  function handlePickPhoto() {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Camera',        onPress: () => pickAndSave(true) },
      { text: 'Photo Library', onPress: () => pickAndSave(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickAndSave(useCamera) {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Photo library access is needed.'); return; }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, allowsEditing: true, aspect: [1, 1], base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, allowsEditing: true, aspect: [1, 1], base64: true });

      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) { Alert.alert('Error', 'Could not read image. Try again.'); return; }

      setUploading(true);
      const ext = asset.uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      const base64String = `data:${mime};base64,${asset.base64}`;

      const { error } = await supabase.from('users').update({ avatar_base64: base64String }).eq('id', user.id);
      if (error) throw error;
      await refreshUserProfile();
      setAvatarBase64(base64String);
      Alert.alert('Success', 'Profile photo updated!');
    } catch (err) {
      console.error('Photo save error:', err);
      Alert.alert('Error', err.message || 'Failed to save photo');
    } finally {
      setUploading(false);
    }
  }

  const avatarSource = avatarBase64 ? { uri: avatarBase64 } : null;

  // Summary counts
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;
  const pendingCount  = documents.filter(d => d.status === 'pending_review' || d.status === 'pending').length;

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
          <Ionicons name="ellipsis-vertical" size={24} color="#ff9800" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <TouchableOpacity onPress={handlePickPhoto} disabled={uploading} style={styles.avatarContainer}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.full_name?.charAt(0)?.toUpperCase() ?? 'D'}</Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to change photo</Text>
        <Text style={styles.name}>{userInfo?.full_name || user?.full_name || 'Driver'}</Text>
        <Text style={styles.phone}>{userInfo?.phone || user?.phone}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Driver</Text>
        </View>

        {/* Driver ID */}
        <View style={styles.driverIDBox}>
          <View style={styles.driverIDContainer}>
            <Text style={styles.driverIDLabel}>ID: </Text>
            <Text style={styles.driverIDValue}>{`KUSHD${String(driverProfile?.id?.charCodeAt(0) || 12345).padStart(6, '0')}`}</Text>
          </View>
        </View>
      </View>


      {/* Documents Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setDocsExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={18} color="#4caf50" />
            <Text style={styles.sectionTitle}>My Documents</Text>
            {documents.length > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{documents.length}</Text>
              </View>
            )}
          </View>
          <Ionicons
            name={docsExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {docsExpanded && (
          <>
            {docsLoading ? (
              <ActivityIndicator color="#4caf50" style={{ paddingVertical: 16 }} />
            ) : documents.length === 0 ? (
              <View style={styles.emptyDocs}>
                <Ionicons name="document-outline" size={32} color="#555" />
                <Text style={styles.emptyDocsText}>No documents uploaded yet</Text>
              </View>
            ) : (
              documents.map((doc) => {
                const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
                const isUpdating = updatingDoc === doc.document_type;

                return (
                  <View key={doc.id || doc.document_type} style={styles.docRow}>
                    {/* Icon - tap to preview */}
                    <TouchableOpacity
                      style={[styles.docIcon, { backgroundColor: cfg.color + '20' }]}
                      onPress={() => doc.document_url && setPreviewDoc({
                        label: documentService.getDocumentLabel(doc.document_type),
                        url: doc.document_url,
                        rejectionReason: doc.rejection_reason,
                        status: doc.status,
                      })}
                      disabled={!doc.document_url}
                    >
                      <Ionicons name={documentService.getDocumentIcon(doc.document_type)} size={20} color={cfg.color} />
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{documentService.getDocumentLabel(doc.document_type)}</Text>
                      {doc.status === 'rejected' && doc.rejection_reason ? (
                        <Text style={styles.docRejectionReason} numberOfLines={1}>⚠️ {doc.rejection_reason}</Text>
                      ) : (
                        <Text style={styles.docDate}>
                          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Not uploaded'}
                        </Text>
                      )}
                    </View>

                    {/* Status */}
                    <View style={styles.docStatus}>
                      <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                      <Text style={[styles.docStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>

                    {/* Update button */}
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={() => handleUpdateDocument(doc)}
                      disabled={isUpdating}
                    >
                      {isUpdating
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
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
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
                userType="driver"
                fullName={userInfo?.full_name || user?.full_name}
                phone={userInfo?.phone || user?.phone}
                photo={avatarBase64}
                licenseNumber={driverProfile?.license_number}
                vehicleNumber={driverProfile?.vehicle_number}
                serialNumber={driverProfile?.id?.charCodeAt(0) || 12345}
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
            {/* Status badge */}
            {previewDoc && (() => {
              const cfg = STATUS_CONFIG[previewDoc.status] || STATUS_CONFIG.pending;
              return (
                <View style={[styles.modalStatusBadge, { backgroundColor: cfg.color + '25', borderColor: cfg.color }]}>
                  <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                  <Text style={[styles.modalStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              );
            })()}
            {previewDoc?.rejectionReason ? (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                <Text style={styles.rejectionText}>{previewDoc.rejectionReason}</Text>
              </View>
            ) : null}
            {previewDoc?.url ? (
              <Image
                source={{ uri: previewDoc.url }}
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
  headerTitle: { color: '#ff9800', fontSize: 18, fontWeight: '600' },
  settingsBtn: { padding: 8 },
  
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  scroll: { padding: 16, paddingTop: 20, paddingBottom: 40 },

  // Avatar
  avatarWrap: { alignItems: 'center', marginBottom: 20, backgroundColor: '#ffffff', borderRadius: 14, padding: 16 },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#ff9800' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#ff9800' },
  avatarText: { color: '#333', fontSize: 36, fontWeight: 'bold' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#ff9800', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  photoHint: { color: '#888', fontSize: 11, marginBottom: 6 },
  name: { color: '#333', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  phone: { color: '#666', fontSize: 13, marginBottom: 6 },
  roleBadge: { backgroundColor: '#ff980020', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 2, borderColor: '#ff9800' },
  roleText: { color: '#ff9800', fontSize: 12, fontWeight: '600' },

  driverIDBox: {
    marginTop: 10,
  },

  driverIDContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff980020',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ff9800',
  },

  driverIDLabel: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '600',
  },

  driverIDValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff9800',
  },

  idCardButton: {
    marginTop: 10,
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
    fontSize: 12,
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

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#ff9800' },
  statNum: { fontSize: 20, fontWeight: '700', marginBottom: 2, color: '#333' },
  statLabel: { color: '#666', fontSize: 11, fontWeight: '500' },

  // Documents section
  section: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 2, borderColor: '#ff9800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#333', fontSize: 15, fontWeight: '700' },
  sectionBadge: { backgroundColor: '#4caf5030', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  sectionBadgeText: { color: '#4caf50', fontSize: 11, fontWeight: '700' },
  sectionCount: { color: '#888', fontSize: 11 },
  emptyDocs: { alignItems: 'center', paddingVertical: 20, gap: 8, paddingTop: 12 },
  emptyDocsText: { color: '#888', fontSize: 12 },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', gap: 12, marginTop: 4 },
  docIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docName: { color: '#333', fontSize: 12, fontWeight: '500', marginBottom: 2 },
  docDate: { color: '#888', fontSize: 11 },
  docRejectionReason: { color: '#ef5350', fontSize: 11 },
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
  menu: { backgroundColor: '#ffffff', borderRadius: 14, marginBottom: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#ff9800' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  menuLabel: { color: '#333', fontSize: 14, flex: 1 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#ef5350' },
  signOutText: { color: '#ef5350', fontSize: 15, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: 14, width: '100%', maxHeight: '85%', padding: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: '#333', fontSize: 15, fontWeight: '700', flex: 1 },
  modalStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  modalStatusText: { fontSize: 12, fontWeight: '600' },
  rejectionBox: { backgroundColor: '#ef535015', borderLeftWidth: 3, borderLeftColor: '#ef5350', borderRadius: 6, padding: 10, marginBottom: 10 },
  rejectionLabel: { color: '#ef5350', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  rejectionText: { color: '#ddd', fontSize: 12 },
  previewImage: { width: '100%', height: 320, borderRadius: 10, backgroundColor: '#0d0f1a' },
  noPreview: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noPreviewText: { color: '#aaa', fontSize: 13 },
});
