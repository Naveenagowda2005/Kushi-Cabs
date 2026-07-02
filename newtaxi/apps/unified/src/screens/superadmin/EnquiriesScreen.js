import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, TRIP_STATUS } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';
import CreateEnquiryForm from '../../components/CreateEnquiryForm';

export default function SuperAdminEnquiriesScreen({ navigation }) {
  const { forceUpdate } = useTheme();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const filteredEnquiries = useMemo(() => {
    if (!searchQuery.trim()) return enquiries;
    return enquiries.filter(e =>
      e.pickup_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.dropoff_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.passenger_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.passenger_phone?.includes(searchQuery)
    );
  }, [searchQuery, enquiries]);

  useEffect(() => {
    fetchEnquiries();

    // Realtime subscription — unique name to avoid duplicate channel errors
    const channel = supabase
      .channel(`superadmin-trips-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchEnquiries();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching enquiries from trips table');
      
      // First, fetch all trips without joins to avoid relationship errors
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching trips:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} trips`);
      setEnquiries(data || []);
    } catch (error) {
      console.error('❌ Error fetching enquiries:', error);
      Alert.alert('Error', 'Failed to load enquiries: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEnquiry = useCallback(async (enquiryId) => {
    Alert.alert('Delete Enquiry', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('trips').delete().eq('id', enquiryId);
            if (error) throw error;
            Alert.alert('Success', 'Enquiry deleted successfully');
            fetchEnquiries();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete enquiry');
          }
        },
      },
    ]);
  }, [fetchEnquiries]);

  const handleCreateSuccess = useCallback(() => { fetchEnquiries(); }, [fetchEnquiries]);

  const getStatusColor = (status) => {
    switch (status) {
      case TRIP_STATUS.PENDING: return COLORS.warning;
      case TRIP_STATUS.ACCEPTED: return COLORS.info;
      case TRIP_STATUS.IN_PROGRESS: return COLORS.superAdmin.primary;
      case TRIP_STATUS.COMPLETED: return COLORS.success;
      case TRIP_STATUS.CANCELLED: return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case TRIP_STATUS.PENDING: return 'Pending';
      case TRIP_STATUS.ACCEPTED: return 'Accepted';
      case TRIP_STATUS.IN_PROGRESS: return 'In Progress';
      case TRIP_STATUS.COMPLETED: return 'Completed';
      case TRIP_STATUS.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const EnquiryCard = React.memo(({ enquiry }) => (
    <TouchableOpacity
      style={styles.enquiryCard}
      onPress={() => { setSelectedEnquiry(enquiry); setModalVisible(true); }}
    >
      <View style={styles.enquiryHeader}>
        <View style={styles.enquiryInfo}>
          <Text style={styles.passengerName}>{enquiry.passenger_name || 'No Name'}</Text>
          <Text style={styles.passengerPhone}>{enquiry.passenger_phone || 'No Phone'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(enquiry.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(enquiry.status) }]}>
            {getStatusText(enquiry.status)}
          </Text>
        </View>
      </View>

      <View style={styles.locationInfo}>
        <View style={styles.locationItem}>
          <Ionicons name="location-outline" size={16} color={COLORS.success} />
          <Text style={styles.locationText} numberOfLines={1}>From: {enquiry.pickup_location}</Text>
        </View>
        <View style={styles.locationItem}>
          <Ionicons name="flag-outline" size={16} color={COLORS.error} />
          <Text style={styles.locationText} numberOfLines={1}>To: {enquiry.dropoff_location}</Text>
        </View>
      </View>

      <View style={styles.enquiryDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(enquiry.scheduled_at || enquiry.created_at).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>₹{enquiry.fare_amount || 0}</Text>
        </View>
      </View>

      {enquiry.created_by && (
        <View style={styles.detailItem}>
          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>Created by: {enquiry.created_by.substring(0, 8)}...</Text>
        </View>
      )}

      {enquiry.status === TRIP_STATUS.PENDING && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteEnquiry(enquiry.id)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  ));

  // Detail modal
  const DetailModal = () => (
    <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Enquiry Details</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        {selectedEnquiry && (
          <View style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Passenger</Text>
              <Text style={styles.modalText}>Name: {selectedEnquiry.passenger_name || 'N/A'}</Text>
              <Text style={styles.modalText}>Phone: {selectedEnquiry.passenger_phone || 'N/A'}</Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Trip</Text>
              <Text style={styles.modalText}>From: {selectedEnquiry.pickup_location}</Text>
              <Text style={styles.modalText}>To: {selectedEnquiry.dropoff_location}</Text>
              <Text style={styles.modalText}>Fare: ₹{selectedEnquiry.fare_amount || 0}</Text>
              <Text style={styles.modalText}>Status: {getStatusText(selectedEnquiry.status)}</Text>
              <Text style={styles.modalText}>Scheduled: {new Date(selectedEnquiry.scheduled_at || selectedEnquiry.created_at).toLocaleString()}</Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Additional Info</Text>
              <Text style={styles.modalText}>Trip ID: {selectedEnquiry.id}</Text>
              <Text style={styles.modalText}>Fixed KM: {selectedEnquiry.fixed_km || 'N/A'}</Text>
              <Text style={styles.modalText}>Commission: ₹{selectedEnquiry.commission_amount || 0}</Text>
              <Text style={styles.modalText}>Toll Included: {selectedEnquiry.toll_included ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enquiries Management</Text>
        <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={24} color={COLORS.superAdmin.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search enquiries..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{enquiries.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{enquiries.filter(e => e.status === TRIP_STATUS.PENDING).length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{enquiries.filter(e => e.status === TRIP_STATUS.IN_PROGRESS).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{enquiries.filter(e => e.status === TRIP_STATUS.COMPLETED).length}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      <FlatList
        data={filteredEnquiries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EnquiryCard enquiry={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEnquiries} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No enquiries found</Text>
              <Text style={styles.emptySubtext}>Tap + to create the first enquiry</Text>
            </View>
          )
        }
      />

      <DetailModal />

      <Modal visible={createModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCreateModalVisible(false)}>
        <CreateEnquiryForm onClose={() => setCreateModalVisible(false)} onSuccess={handleCreateSuccess} />
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
  enquiryCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  enquiryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  enquiryInfo: { flex: 1 },
  passengerName: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  passengerPhone: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: getResponsiveFontSize(12), fontWeight: '500' },
  locationInfo: { marginBottom: 12 },
  locationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locationText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginLeft: 8, flex: 1 },
  enquiryDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary, marginLeft: 4 },
  actionButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.error + '20', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  deleteButtonText: { fontSize: getResponsiveFontSize(12), color: COLORS.error, fontWeight: '500', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: getResponsiveFontSize(18), fontWeight: '600', color: COLORS.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  modalContent: { flex: 1, padding: getResponsivePadding(24) },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  modalText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginBottom: 8 },
});
