import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, API_CONFIG } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';
import IDCard from '../../components/IDCard';

export default function SuperAdminVendorsScreen({ navigation }) {
  const { forceUpdate } = useTheme();
  
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

  useEffect(() => { fetchVendors(); }, []);
  useEffect(() => { filterVendors(); }, [searchQuery, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users').select('id, full_name, phone, is_active, avatar_base64, created_at, role_id').eq('role_id', 2).order('created_at', { ascending: false });
      if (error) throw error;

      const vendorsWithDetails = await Promise.all(
        (data || []).map(async (user) => {
          const { data: vendorProfile } = await supabase.from('vendors').select('*').eq('user_id', user.id).single();
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          
          // Fetch vendor selfie photo from vendor_documents table
          let documentPhoto = null;
          try {
            // Query vendor_documents with user_id (the foreign key)
            const { data: vendorDocs } = await supabase
              .from('vendor_documents')
              .select('documents')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (vendorDocs?.documents?.VENDOR_SELFIE?.document_data) {
              const photoData = vendorDocs.documents.VENDOR_SELFIE.document_data;
              documentPhoto = photoData.startsWith('data:') 
                ? photoData
                : `data:image/jpeg;base64,${photoData}`;
              console.log('✅ Found VENDOR_SELFIE photo for:', user.full_name);
            }
          } catch (docError) {
            console.log('⚠️ Error fetching vendor docs:', docError.message);
          }
          
          return { 
            ...user, 
            vendors: vendorProfile ? [vendorProfile] : [], 
            wallets: wallet ? [wallet] : [], 
            documentPhoto 
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

  const VendorCard = ({ vendor }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedVendor(vendor); setModalVisible(true); }}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{vendor.full_name || 'No Name'}</Text>
          <Text style={styles.businessName}>{vendor.vendors?.[0]?.company_name || 'No Company'}</Text>
          <Text style={styles.cardSub}>{vendor.phone || 'No Phone'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (vendor.is_active ? COLORS.success : COLORS.error) + '20' }]}>
          <Text style={[styles.statusText, { color: vendor.is_active ? COLORS.success : COLORS.error }]}>
            {vendor.is_active ? 'Active' : 'Blocked'}
          </Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}><Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>₹{vendor.wallets?.[0]?.balance || 0}</Text></View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: (vendor.is_active ? COLORS.error : COLORS.success) + '20' }]} onPress={() => toggleVendorStatus(vendor.id, vendor.is_active)}>
          <Ionicons name={vendor.is_active ? 'ban-outline' : 'checkmark-circle-outline'} size={16} color={vendor.is_active ? COLORS.error : COLORS.success} />
          <Text style={[styles.actionButtonText, { color: vendor.is_active ? COLORS.error : COLORS.success }]}>{vendor.is_active ? 'Block' : 'Activate'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.error + '20' }]} onPress={() => deleteVendor(vendor.id, vendor.users?.phone || vendor.phone)}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9c27b020' }]} onPress={() => { setSelectedVendor(vendor); setShowIDCard(true); }}>
          <Ionicons name="card" size={16} color="#9c27b0" />
          <Text style={[styles.actionButtonText, { color: '#9c27b0' }]}>ID Card</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.statItem}><Text style={styles.statValue}>{vendors.filter(v => v.is_active).length}</Text><Text style={styles.statLabel}>Active</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{vendors.filter(v => !v.is_active).length}</Text><Text style={styles.statLabel}>Blocked</Text></View>
      </View>

      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VendorCard vendor={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchVendors} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && <View style={styles.emptyContainer}><Ionicons name="business-outline" size={64} color={COLORS.textSecondary} /><Text style={styles.emptyText}>No vendors found</Text></View>}
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
                  photo={selectedVendor.avatar_base64 || selectedVendor.documentPhoto}
                  companyName={selectedVendor.vendors?.[0]?.company_name}
                  serialNumber={selectedVendor.vendors?.[0]?.id?.charCodeAt(0) || 12345}
                  isApproved={true}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  cardName: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  businessName: { fontSize: getResponsiveFontSize(14), color: COLORS.superAdmin.primary, fontWeight: '500', marginBottom: 2 },
  cardSub: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: getResponsiveFontSize(12), fontWeight: '500' },
  cardDetails: { marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginLeft: 8, flex: 1 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flex: 1, justifyContent: 'center' },
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
});
