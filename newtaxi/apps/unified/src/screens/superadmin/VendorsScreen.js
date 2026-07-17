import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { useAlert } from '../../context/AlertContext';
import { COLORS, API_CONFIG } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';
import IDCard from '../../components/IDCard';
import DocumentViewer from '../../components/DocumentViewer';

export default function SuperAdminVendorsScreen({ navigation }) {
  const { forceUpdate } = useTheme();
  const { isMuted } = useAlert();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showIDCard, setShowIDCard] = useState(false);
  const [vendorPhotoForIDCard, setVendorPhotoForIDCard] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [vendorDocuments, setVendorDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentViewerVisible, setDocumentViewerVisible] = useState(false);

  useEffect(() => { fetchVendors(); }, []);
  useEffect(() => { filterVendors(); }, [searchQuery, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users').select('id, full_name, phone, is_active, avatar_base64, created_at, role_id, verification_status').eq('role_id', 2).order('created_at', { ascending: false });
      if (error) throw error;

      const vendorsWithDetails = await Promise.all(
        (data || []).map(async (user) => {
          const { data: vendorProfile } = await supabase.from('vendors').select('*').eq('user_id', user.id).single();
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          
          return { 
            ...user, 
            vendors: vendorProfile ? [vendorProfile] : [], 
            wallets: wallet ? [wallet] : [], 
            documentPhoto: null  // Don't load document photo on list view
          };
        })
      );
      setVendors(vendorsWithDetails);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    if (!searchQuery.trim()) { setFilteredVendors(vendors); return; }
    setFilteredVendors(vendors.filter(v =>
      v.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone?.includes(searchQuery) ||
      v.vendors?.[0]?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  };

  const toggleVendorStatus = async (vendorId, currentStatus) => {
    const action = currentStatus ? 'block' : 'activate';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} Vendor`, `Are you sure you want to ${action} this vendor?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action.charAt(0).toUpperCase() + action.slice(1), style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('users').update({ is_active: !currentStatus }).eq('id', vendorId);
            if (error) throw error;
            Alert.alert('Success', `Vendor ${action}d successfully`);
            
            
            fetchVendors();
          } catch (error) { Alert.alert('Error', `Failed to ${action} vendor`); }
        },
      },
    ]);
  };

  const deleteVendor = async (vendorId, vendorPhone) => {
    Alert.alert('Delete Vendor', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/delete-user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: vendorId,
                phone: vendorPhone,
                email: `${vendorPhone}@kushicabs.phone`
              })
            });

            const result = await response.json();

            if (!response.ok) {
              // Check if error is due to pending trips
              if (result.pendingTripsCount > 0) {
                Alert.alert(
                  'Cannot Delete Vendor',
                  `${result.message}\n\nPending Trips: ${result.pendingTripsCount}\nStatuses: ${result.tripStatuses?.join(', ') || 'N/A'}`
                );
              } else {
                throw new Error(result.message || 'Failed to delete vendor');
              }
              return;
            }

            Alert.alert('Success', 'Vendor deleted successfully');
            fetchVendors();
          } catch (error) {
            console.error('Delete vendor error:', error);
            Alert.alert('Error', error.message || 'Failed to delete vendor');
          }
        },
      },
    ]);
  };

  const fetchAndViewVendorDocuments = async (vendor) => {
    try {
      console.log('📄 Fetching documents for vendor:', vendor.full_name, 'user_id:', vendor.id);
      
      // First open the modal with loading state
      setShowDocumentsModal(true);
      setLoadingDocuments(true);
      setVendorDocuments([]);
      
      const { data: docs, error } = await supabase
        .from('vendor_documents')
        .select('documents')
        .eq('user_id', vendor.id)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching documents:', error);
        Alert.alert('Error', 'Failed to load documents: ' + error.message);
        setLoadingDocuments(false);
        return;
      }
      
      if (!docs || !docs.documents) {
        console.log('⚠️ No documents found for vendor');
        setVendorDocuments([]);
      } else {
        // Transform vendor_documents format to array
        const docArray = Object.entries(docs.documents).map(([docType, docData]) => ({
          document_type: docType,
          document_data: docData.document_data,
          document_mime_type: docData.document_mime_type || 'image/jpeg',
          created_at: docData.uploaded_at || new Date().toISOString(),
        }));
        console.log('✅ Found', docArray.length, 'documents for vendor');
        setVendorDocuments(docArray);
      }
      
      setLoadingDocuments(false);
    } catch (e) {
      console.error('❌ Exception in fetchAndViewVendorDocuments:', e);
      Alert.alert('Error', 'Failed to load documents: ' + e.message);
      setLoadingDocuments(false);
    }
  };

  const fetchVendorPhotoForIDCard = async (vendor) => {
    try {
      console.log('📸 Fetching vendor photo for ID card:', vendor.id);
      
      // Try to get VENDOR_SELFIE document
      const { data: docs, error } = await supabase
        .from('vendor_documents')
        .select('documents')
        .eq('user_id', vendor.id)
        .maybeSingle();
      
      if (!error && docs?.documents?.VENDOR_SELFIE?.document_data) {
        console.log('✅ Found VENDOR_SELFIE, setting photo');
        setVendorPhotoForIDCard(docs.documents.VENDOR_SELFIE.document_data);
      } else {
        console.log('⚠️ No VENDOR_SELFIE found, using avatar_base64');
        setVendorPhotoForIDCard(vendor.avatar_base64 || null);
      }
    } catch (e) {
      console.error('Error fetching vendor photo:', e);
      setVendorPhotoForIDCard(vendor.avatar_base64 || null);
    }
  };

  const VendorCard = React.memo(({ vendor }) => {
    // Check if this is a dummy vendor
    const isDummyVendor = vendor.vendors?.[0]?.company_name?.trim().toUpperCase().startsWith('DUMMY');
    
    // Determine approval status
    const getApprovalStatus = () => {
      const verificationStatus = vendor.verification_status;
      if (verificationStatus === 'approved') return { text: 'Approved', color: COLORS.success };
      if (verificationStatus === 'rejected') return { text: 'Rejected', color: COLORS.error };
      if (verificationStatus === 'pending') return { text: 'Pending', color: COLORS.warning };
      return { text: 'Pending', color: COLORS.warning }; // Default
    };
    
    const approval = getApprovalStatus();

    return (
      <TouchableOpacity style={styles.card} onPress={() => { setSelectedVendor(vendor); setModalVisible(true); }}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.badgesRow}>
              <Text style={styles.cardName}>{vendor.full_name || 'No Name'}</Text>
              {isDummyVendor && (
                <View style={styles.dummyBadge}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text style={styles.dummyBadgeText}>DUMMY</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: approval.color + '20' }]}>
            <Text style={[styles.statusText, { color: approval.color }]}>
              {approval.text}
            </Text>
          </View>
        </View>
        <View style={styles.cardInfoDetails}>
          <Text style={styles.businessName}>{vendor.vendors?.[0]?.company_name || 'No Company'}</Text>
          <Text style={styles.cardSub}>{vendor.phone || 'No Phone'}</Text>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}><Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>₹{vendor.wallets?.[0]?.balance || 0}</Text></View>
        </View>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: (vendor.is_active ? COLORS.error : COLORS.success) + '20' }]} onPress={() => toggleVendorStatus(vendor.id, vendor.is_active)}>
            <Ionicons name={vendor.is_active ? 'ban-outline' : 'checkmark-circle-outline'} size={16} color={vendor.is_active ? COLORS.error : COLORS.success} />
            <Text style={[styles.actionButtonText, { color: vendor.is_active ? COLORS.error : COLORS.success }]}>{vendor.is_active ? 'Block' : 'Activate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.error + '20' }]} onPress={() => deleteVendor(vendor.id, vendor.users?.phone || vendor.phone)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9c27b020' }]} onPress={() => { setSelectedVendor(vendor); fetchVendorPhotoForIDCard(vendor); setShowIDCard(true); }}>
            <Ionicons name="card" size={16} color="#9c27b0" />
            <Text style={[styles.actionButtonText, { color: '#9c27b0' }]}>ID Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2196F320' }]} onPress={() => fetchAndViewVendorDocuments(vendor)}>
            <Ionicons name="document-outline" size={16} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Documents</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendors Management</Text>
        <TouchableOpacity onPress={fetchVendors}><Ionicons name="refresh-outline" size={24} color={COLORS.superAdmin.primary} /></TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search vendors..." placeholderTextColor={COLORS.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}><Text style={styles.statValue}>{vendors.length}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{vendors.filter(v => v.verification_status === 'approved').length}</Text><Text style={styles.statLabel}>Approved</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{vendors.filter(v => v.verification_status === 'pending').length}</Text><Text style={styles.statLabel}>Pending</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{vendors.filter(v => v.verification_status === 'rejected').length}</Text><Text style={styles.statLabel}>Rejected</Text></View>
      </View>

      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VendorCard vendor={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchVendors} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.warning} />
              <Text style={styles.loadingText}>Loading vendors...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          )
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vendor Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          {selectedVendor && (
            <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
                <Text style={styles.modalText}>Name: {selectedVendor.full_name || 'N/A'}</Text>
                <Text style={styles.modalText}>Phone: {selectedVendor.phone || 'N/A'}</Text>
                <Text style={styles.modalText}>Status: <Text style={{ color: selectedVendor.is_active ? COLORS.success : COLORS.error }}>{selectedVendor.is_active ? 'Active' : 'Blocked'}</Text></Text>
                <Text style={styles.modalText}>Approval: <Text style={{ color: selectedVendor.verification_status === 'approved' ? COLORS.success : selectedVendor.verification_status === 'rejected' ? COLORS.error : COLORS.warning }}>{selectedVendor.verification_status?.charAt(0).toUpperCase() + selectedVendor.verification_status?.slice(1) || 'Pending'}</Text></Text>
                <Text style={styles.modalText}>Joined: {new Date(selectedVendor.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Business Information</Text>
                <Text style={styles.modalText}>Company: {selectedVendor.vendors?.[0]?.company_name || 'N/A'}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Wallet</Text>
                <Text style={[styles.modalText, { fontSize: getResponsiveFontSize(18), fontWeight: 'bold', color: COLORS.superAdmin.primary }]}>
                  Balance: ₹{selectedVendor.wallets?.[0]?.balance || 0}
                </Text>
                <TouchableOpacity 
                  style={styles.markPaidButton}
                  onPress={() => {
                    console.log('🔄 Mark Payment button pressed for vendor:', selectedVendor.id);
                    setPaymentAmount('');
                    setPaymentModalVisible(true);
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.markPaidButtonText}>Mark Payment as Paid</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal visible={paymentModalVisible} animationType="fade" transparent={true} onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModalContent}>
            <Text style={styles.paymentModalTitle}>Mark Payment as Paid</Text>
            <Text style={styles.paymentModalLabel}>Enter amount to add to vendor wallet:</Text>
            <TextInput
              style={styles.paymentInput}
              placeholder="Enter amount"
              placeholderTextColor={COLORS.textSecondary}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              editable={true}
            />
            <View style={styles.paymentButtonContainer}>
              <TouchableOpacity
                style={[styles.paymentButton, { backgroundColor: COLORS.border }]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={[styles.paymentButtonText, { color: COLORS.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentButton, { backgroundColor: COLORS.superAdmin.primary }]}
                onPress={async () => {
                  console.log('💰 Processing payment:', { vendorId: selectedVendor.id, amount: paymentAmount });
                  
                  if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
                    console.error('❌ Invalid amount:', paymentAmount);
                    Alert.alert('Error', 'Please enter a valid amount');
                    return;
                  }

                  try {
                    const numAmount = parseFloat(paymentAmount);
                    console.log('🔄 Fetching wallet for vendor:', selectedVendor.id);
                    
                    // Fetch current wallet
                    const { data: wallet, error: walletError } = await supabase
                      .from('wallets')
                      .select('id, balance')
                      .eq('user_id', selectedVendor.id)
                      .single();

                    if (walletError) {
                      console.error('❌ Wallet fetch error:', walletError);
                      Alert.alert('Error', 'Wallet not found: ' + walletError.message);
                      return;
                    }

                    if (!wallet) {
                      console.error('❌ No wallet found');
                      Alert.alert('Error', 'Wallet not found');
                      return;
                    }

                    console.log('✅ Wallet found:', wallet);
                    const newBalance = wallet.balance - numAmount;
                    console.log('💾 Updating balance:', { oldBalance: wallet.balance, amount: numAmount, newBalance });

                    // Update wallet balance (deduct the payment)
                    const { error: updateError } = await supabase
                      .from('wallets')
                      .update({ balance: newBalance, updated_at: new Date().toISOString() })
                      .eq('id', wallet.id);

                    if (updateError) {
                      console.error('❌ Update error:', updateError);
                      throw updateError;
                    }

                    console.log('✅ Wallet updated');

                    // Insert transaction (debit type - money paid out)
                    const { error: txError } = await supabase
                      .from('transactions')
                      .insert({
                        wallet_id: wallet.id,
                        type: 'debit',
                        amount: numAmount,
                        description: 'Payment made by super admin',
                      });

                    if (txError) {
                      console.error('❌ Transaction insert error:', txError);
                      throw txError;
                    }

                    console.log('✅ Transaction created');
                    Alert.alert('✅ Success', `₹${numAmount} paid to vendor\nRemaining balance: ₹${newBalance}`);
                    
                    
                    setPaymentModalVisible(false);
                    fetchVendors();
                    setModalVisible(false);
                  } catch (error) {
                    console.error('❌ Error marking payment:', error);
                    Alert.alert('Error', 'Failed to mark payment as paid:\n' + (error.message || JSON.stringify(error)));
                  }
                }}
              >
                <Text style={[styles.paymentButtonText, { color: '#fff' }]}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              {selectedVendor && (
                <IDCard 
                  userType="vendor"
                  fullName={selectedVendor.full_name}
                  phone={selectedVendor.phone}
                  photo={vendorPhotoForIDCard || selectedVendor.avatar_base64}
                  companyName={selectedVendor.vendors?.[0]?.company_name}
                  serialNumber={selectedVendor.vendors?.[0]?.id?.charCodeAt(0) || 12345}
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
            <Text style={styles.modalTitle}>Vendor Documents</Text>
            <TouchableOpacity onPress={() => setShowDocumentsModal(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {loadingDocuments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.warning} />
              <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading documents...</Text>
            </View>
          ) : vendorDocuments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No documents available</Text>
            </View>
          ) : (
            <ScrollView style={styles.documentsListContainer} scrollEnabled={true}>
              {vendorDocuments.map((doc, index) => (
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
                  {doc.document_data ? (
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => {
                        console.log('📸 Opening viewer for:', doc.document_type);
                        console.log('📸 Document data exists:', !!doc.document_data);
                        console.log('📸 Document data length:', doc.document_data?.length || 0);
                        const docData = {
                          data: doc.document_data,
                          type: doc.document_type,
                          mimeType: doc.document_mime_type
                        };
                        console.log('📸 Setting selectedDocument:', docData);
                        setSelectedDocument(docData);
                        console.log('📸 Closing documents modal and opening viewer');
                        // Close documents modal first, then open viewer
                        setShowDocumentsModal(false);
                        setTimeout(() => {
                          console.log('📸 Now opening DocumentViewer');
                          setDocumentViewerVisible(true);
                        }, 100);
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color="#2196F3" />
                      <Text style={{ color: '#2196F3', marginLeft: 4, fontWeight: '500' }}>View</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>No data</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Document Viewer Modal */}
      <DocumentViewer
        visible={documentViewerVisible}
        documentData={selectedDocument?.data}
        documentType={selectedDocument?.type}
        onClose={() => {
          console.log('📷 DocumentViewer closed');
          setDocumentViewerVisible(false);
          setTimeout(() => setSelectedDocument(null), 300);
        }}
      />
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardInfoDetails: { marginBottom: 8 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  cardName: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 2, flexWrap: 'wrap' },
  businessName: { fontSize: getResponsiveFontSize(14), color: COLORS.superAdmin.primary, fontWeight: '500', marginBottom: 2 },
  cardSub: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center', flexShrink: 0 },
  statusText: { fontSize: getResponsiveFontSize(12), fontWeight: '500' },
  dummyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ff9800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, whiteSpace: 'nowrap' },
  dummyBadgeText: { fontSize: getResponsiveFontSize(11), fontWeight: '700', color: '#fff' },
  cardDetails: { marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginLeft: 8, flex: 1 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
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
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.superAdmin.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  markPaidButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  paymentModalTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  paymentModalLabel: {
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: getResponsiveFontSize(16),
    color: COLORS.text,
    marginBottom: 20,
  },
  paymentButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },

  idCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.superAdmin.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },

  idCardButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
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
  documentViewerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  documentViewerEmptyText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
