import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, API_CONFIG } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';
import IDCard from '../../components/IDCard';

export default function SuperAdminDriversScreen({ navigation }) {
  const { forceUpdate } = useTheme();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [driverDocuments, setDriverDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentViewerVisible, setDocumentViewerVisible] = useState(false);

  useEffect(() => { fetchDrivers(); }, []);
  useEffect(() => { filterDrivers(); }, [searchQuery, drivers]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users').select('id, full_name, phone, is_active, avatar_base64, created_at, role_id').eq('role_id', 3).order('created_at', { ascending: false });
      if (error) throw error;

      const driversWithDetails = await Promise.all(
        (data || []).map(async (user) => {
          const { data: driverProfile } = await supabase.from('drivers').select('*').eq('user_id', user.id).single();
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          
          // Fetch driver selfie photo
          let documentPhoto = null;
          try {
            // Query driver documents using user_id (driver_id column references users.id)
            console.log('🔍 Fetching docs for user_id:', user.id, 'user:', user.full_name);
            const { data: driverDocs, error: docError } = await supabase
              .from('driver_documents')
              .select('*')
              .eq('driver_id', user.id)
              .order('document_type', { ascending: true });

            if (docError) {
              console.log('❌ Query error:', docError);
            }

            if (driverDocs && driverDocs.length > 0) {
              console.log('📋 Found', driverDocs.length, 'docs for', user.full_name, '- types:', driverDocs.map(d => d.document_type));
              // Find DRIVER_SELFIE document
              const selfie = driverDocs.find(d => d.document_type === 'DRIVER_SELFIE' && d.document_data);
              if (selfie) {
                const photoData = selfie.document_data;
                documentPhoto = photoData.startsWith('data:') 
                  ? photoData
                  : `data:${selfie.document_mime_type || 'image/jpeg'};base64,${photoData}`;
                console.log('✅ Found DRIVER_SELFIE photo for:', user.full_name);
              } else {
                console.log('⚠️ No DRIVER_SELFIE with data found for:', user.full_name);
              }
            } else {
              console.log('⚠️ No driver documents found for', user.full_name, '(user_id:', user.id + ')');
            }
          } catch (err) {
            console.log('❌ Exception fetching driver documents:', err.message);
          }
          
          return { 
            ...user, 
            drivers: driverProfile ? [driverProfile] : [], 
            wallets: wallet ? [wallet] : [], 
            documentPhoto 
          };
        })
      );
      setDrivers(driversWithDetails);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const filterDrivers = () => {
    if (!searchQuery.trim()) { setFilteredDrivers(drivers); return; }
    setFilteredDrivers(drivers.filter(d =>
      d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone?.includes(searchQuery) ||
      d.drivers?.[0]?.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.drivers?.[0]?.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  };

  const toggleDriverStatus = async (driverId, currentStatus) => {
    const action = currentStatus ? 'block' : 'activate';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} Driver`, `Are you sure you want to ${action} this driver?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action.charAt(0).toUpperCase() + action.slice(1), style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('users').update({ is_active: !currentStatus }).eq('id', driverId);
            if (error) throw error;
            Alert.alert('Success', `Driver ${action}d successfully`);
            fetchDrivers();
          } catch (error) { Alert.alert('Error', `Failed to ${action} driver`); }
        },
      },
    ]);
  };

  const deleteDriver = async (driverId, driverPhone) => {
    Alert.alert('Delete Driver', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/delete-user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: driverId,
                phone: driverPhone,
                email: `${driverPhone}@kushicabs.phone`
              })
            });

            const result = await response.json();

            if (!response.ok) {
              if (result.pendingTripsCount > 0) {
                Alert.alert(
                  'Cannot Delete Driver',
                  `${result.message}\n\nPending Trips: ${result.pendingTripsCount}\nStatuses: ${result.tripStatuses?.join(', ') || 'N/A'}`
                );
              } else {
                const errorMsg = result.details || result.message || result.error || 'Failed to delete driver';
                throw new Error(errorMsg);
              }
              return;
            }

            Alert.alert('Success', 'Driver deleted successfully');
            fetchDrivers();
          } catch (error) {
            console.error('Delete driver error:', error);
            Alert.alert('Error', error.message || 'Failed to delete driver');
          }
        },
      },
    ]);
  };

  const fetchAndViewDriverDocuments = async (driver) => {
    try {
      setLoadingDocuments(true);
      setShowDocumentsModal(true);
      
      console.log('📄 Fetching documents for driver:', driver.full_name, 'user_id:', driver.id);
      
      const { data: docs, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driver.id);
      
      if (error) {
        console.error('Error fetching documents:', error);
        Alert.alert('Error', 'Failed to load documents');
        setLoadingDocuments(false);
        return;
      }
      
      if (!docs || docs.length === 0) {
        setDriverDocuments([]);
        console.log('⚠️ No documents found for driver');
      } else {
        console.log('✅ Found', docs.length, 'documents for driver');
        setDriverDocuments(docs);
      }
    } catch (e) {
      console.error('Error in fetchAndViewDriverDocuments:', e);
      Alert.alert('Error', e.message);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const DriverCard = ({ driver }) => {
    // Check if this is a dummy driver (license number starts with DUMMY-)
    const isDummyDriver = driver.drivers?.[0]?.license_number?.toUpperCase().startsWith('DUMMY-');

    return (
      <TouchableOpacity style={styles.card} onPress={() => { setSelectedDriver(driver); setModalVisible(true); }}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={styles.cardName}>{driver.full_name || 'No Name'}</Text>
              {isDummyDriver && (
                <View style={styles.dummyBadge}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text style={styles.dummyBadgeText}>DUMMY</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSub}>{driver.phone || 'No Phone'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (driver.is_active ? COLORS.success : COLORS.error) + '20' }]}>
            <Text style={[styles.statusText, { color: driver.is_active ? COLORS.success : COLORS.error }]}>
              {driver.is_active ? 'Active' : 'Blocked'}
            </Text>
          </View>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}><Ionicons name="card-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>{driver.drivers?.[0]?.license_number || 'No License'}</Text></View>
          <View style={styles.detailItem}><Ionicons name="car-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>{driver.drivers?.[0]?.vehicle_number || 'No Vehicle'}</Text></View>
          <View style={styles.detailItem}><Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>₹{driver.wallets?.[0]?.balance || 0}</Text></View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: (driver.is_active ? COLORS.error : COLORS.success) + '20' }]} onPress={() => toggleDriverStatus(driver.id, driver.is_active)}>
            <Ionicons name={driver.is_active ? 'ban-outline' : 'checkmark-circle-outline'} size={16} color={driver.is_active ? COLORS.error : COLORS.success} />
            <Text style={[styles.actionButtonText, { color: driver.is_active ? COLORS.error : COLORS.success }]}>{driver.is_active ? 'Block' : 'Activate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.error + '20' }]} onPress={() => deleteDriver(driver.id, driver.users?.phone || driver.phone)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.warning + '20' }]} onPress={() => { setSelectedDriver(driver); setShowIDCard(true); }}>
            <Ionicons name="card" size={16} color={COLORS.warning} />
            <Text style={[styles.actionButtonText, { color: COLORS.warning }]}>ID Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2196F320' }]} onPress={() => fetchAndViewDriverDocuments(driver)}>
            <Ionicons name="document-outline" size={16} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Documents</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Drivers Management</Text>
        <TouchableOpacity onPress={fetchDrivers}><Ionicons name="refresh-outline" size={24} color={COLORS.warning} /></TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search drivers..." placeholderTextColor={COLORS.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.length}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.filter(d => d.is_active).length}</Text><Text style={styles.statLabel}>Active</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.filter(d => !d.is_active).length}</Text><Text style={styles.statLabel}>Blocked</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.filter(d => d.drivers?.[0]?.is_available).length}</Text><Text style={styles.statLabel}>Available</Text></View>
      </View>

      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DriverCard driver={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDrivers} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && <View style={styles.emptyContainer}><Ionicons name="people-outline" size={64} color={COLORS.textSecondary} /><Text style={styles.emptyText}>No drivers found</Text></View>}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Driver Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          {selectedDriver && (
            <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
                <Text style={styles.modalText}>Name: {selectedDriver.full_name || 'N/A'}</Text>
                <Text style={styles.modalText}>Phone: {selectedDriver.phone || 'N/A'}</Text>
                <Text style={styles.modalText}>Status: <Text style={{ color: selectedDriver.is_active ? COLORS.success : COLORS.error }}>{selectedDriver.is_active ? 'Active' : 'Blocked'}</Text></Text>
                <Text style={styles.modalText}>Joined: {new Date(selectedDriver.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Driver Information</Text>
                <Text style={styles.modalText}>License: {selectedDriver.drivers?.[0]?.license_number || 'N/A'}</Text>
                <Text style={styles.modalText}>Vehicle: {selectedDriver.drivers?.[0]?.vehicle_number || 'N/A'}</Text>
                <Text style={styles.modalText}>Available: {selectedDriver.drivers?.[0]?.is_available ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Wallet</Text>
                <Text style={styles.modalText}>Balance: ₹{selectedDriver.wallets?.[0]?.balance || 0}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

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
              {selectedDriver && (
                <IDCard 
                  userType="driver"
                  fullName={selectedDriver.full_name}
                  phone={selectedDriver.phone}
                  photo={selectedDriver.avatar_base64 || selectedDriver.documentPhoto}
                  licenseNumber={selectedDriver.drivers?.[0]?.license_number}
                  vehicleNumber={selectedDriver.drivers?.[0]?.vehicle_number}
                  serialNumber={selectedDriver.drivers?.[0]?.id?.charCodeAt(0) || 12345}
                  isApproved={true}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Documents Modal */}
      <Modal visible={showDocumentsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDocumentsModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Driver Documents</Text>
            <TouchableOpacity onPress={() => setShowDocumentsModal(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {loadingDocuments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.warning} />
              <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading documents...</Text>
            </View>
          ) : driverDocuments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No documents available</Text>
            </View>
          ) : (
            <ScrollView style={styles.documentsListContainer}>
              {driverDocuments.map((doc, index) => (
                <View key={index} style={styles.documentCard}>
                  <View style={styles.documentInfo}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.warning} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.documentType}>{doc.document_type}</Text>
                      <Text style={styles.documentDate}>{new Date(doc.created_at).toLocaleDateString()}</Text>
                      {doc.document_mime_type && (
                        <Text style={styles.documentMime}>{doc.document_mime_type}</Text>
                      )}
                    </View>
                  </View>
                  {doc.document_data && (
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => {
                        setSelectedDocument({
                          data: doc.document_data,
                          type: doc.document_type,
                          mimeType: doc.document_mime_type
                        });
                        setDocumentViewerVisible(true);
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color="#2196F3" />
                      <Text style={{ color: '#2196F3', marginLeft: 4, fontWeight: '500' }}>View</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <Modal visible={documentViewerVisible} animationType="fade" transparent onRequestClose={() => setDocumentViewerVisible(false)}>
          <View style={styles.documentViewerOverlay}>
            <View style={styles.documentViewerHeader}>
              <Text style={styles.documentViewerTitle}>{selectedDocument.type}</Text>
              <TouchableOpacity onPress={() => setDocumentViewerVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.documentViewerContent}>
              {selectedDocument.data && (
                selectedDocument.data.startsWith('data:') ? (
                  <Image
                    source={{ uri: selectedDocument.data }}
                    style={styles.documentImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={{ uri: `data:${selectedDocument.mimeType || 'image/jpeg'};base64,${selectedDocument.data}` }}
                    style={styles.documentImage}
                    resizeMode="contain"
                  />
                )
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.warning },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, marginHorizontal: getResponsivePadding(24), marginVertical: 16, paddingHorizontal: 16 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: getResponsiveFontSize(16), color: COLORS.text, paddingVertical: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.surface, marginHorizontal: getResponsivePadding(24), borderRadius: 12, paddingVertical: 16, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: getResponsiveFontSize(22), fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: getResponsiveFontSize(11), color: COLORS.textSecondary, marginTop: 4 },
  listContainer: { paddingHorizontal: getResponsivePadding(24), paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardSub: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: getResponsiveFontSize(12), fontWeight: '500' },
  dummyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ff9800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dummyBadgeText: { fontSize: getResponsiveFontSize(10), fontWeight: '700', color: '#fff' },
  cardDetails: { marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginLeft: 8 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flex: 1, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  actionButtonText: { fontSize: getResponsiveFontSize(12), fontWeight: '500', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: getResponsiveFontSize(18), fontWeight: '600', color: COLORS.textSecondary, marginTop: 16 },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  modalContent: { flex: 1, padding: getResponsivePadding(24), overflow: 'hidden' },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  modalText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginBottom: 8 },

  idCardButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.warning,
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
    backgroundColor: COLORS.background,
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

  // Document Viewer Styles
  documentsListContainer: {
    flex: 1,
    padding: getResponsivePadding(16),
  },

  documentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },

  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  documentType: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },

  documentDate: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  documentMime: {
    fontSize: getResponsiveFontSize(11),
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F320',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  documentViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },

  documentViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: hp(4),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  documentViewerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: '#fff',
  },

  documentViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  documentImage: {
    width: '100%',
    height: 500,
    marginVertical: 20,
    borderRadius: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

