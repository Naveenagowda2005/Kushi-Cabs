import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS, TRIP_STATUS, COMMISSION_TYPES } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function SuperAdminCommissionScreen({ navigation }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState({
    vendor_commission_type: COMMISSION_TYPES.PERCENTAGE,
    vendor_commission_value: 5,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [stats, setStats] = useState({
    totalCommission: 0,
    vendorCommission: 0,
    monthlyCommission: 0,
  });

  useEffect(() => { 
    fetchCommissionData();
    fetchCommissionSettings();
  }, []);

  const fetchCommissionSettings = async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('vendor_commission_type, vendor_commission_value')
        .eq('id', 'global')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching commission settings:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Commission settings fetched:', data);
        setCommissionSettings({
          vendor_commission_type: data.vendor_commission_type || COMMISSION_TYPES.PERCENTAGE,
          vendor_commission_value: data.vendor_commission_value || 5,
        });
      } else {
        console.warn('⚠️ No commission settings found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      Alert.alert('Error', 'Failed to load commission settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          *,
          accepted_by_user:accepted_by ( full_name ),
          vendors:vendor_id ( users ( full_name ) ),
          created_by_user:created_by ( full_name )
        `)
        .eq('status', TRIP_STATUS.COMPLETED)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(trips || []);

      // Use stored commission_amount from trips table (historical record)
      const totalCommission = trips.reduce((s, t) => s + (t.commission_amount || 0), 0);
      const vendorCommission = totalCommission;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyTrips = trips.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      
      const monthlyCommission = monthlyTrips.reduce((s, t) => s + (t.commission_amount || 0), 0);

      setStats({ totalCommission, vendorCommission, monthlyCommission });
    } catch (error) {
      console.error('Error fetching commission data:', error);
      Alert.alert('Error', 'Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const CommissionCard = ({ commission }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.tripId}>Trip #{commission.id.slice(-8)}</Text>
          <Text style={styles.tripDate}>{new Date(commission.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.commissionAmount}>
          <Text style={styles.commissionValue}>₹{(commission.commission_amount || 0).toFixed(2)}</Text>
          <Text style={styles.commissionLabel}>Commission</Text>
        </View>
      </View>
      <View style={styles.tripDetails}>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Driver:</Text><Text style={styles.detailValue}>{commission.accepted_by_user?.full_name || 'N/A'}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Vendor:</Text><Text style={styles.detailValue}>{commission.vendors?.users?.full_name || commission.created_by_user?.full_name || 'N/A'}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Fare:</Text><Text style={styles.detailValue}>₹{commission.fare_amount || 0}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Commission earned by driver:</Text><Text style={styles.detailValue}>₹{(commission.commission_amount || 0).toFixed(2)}</Text></View>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Route:</Text><Text style={styles.detailValue} numberOfLines={1}>{commission.pickup_location} → {commission.dropoff_location}</Text></View>
      </View>
      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Commission Paid</Text>
          <Text style={styles.breakdownValue}>₹{(commission.commission_amount || 0).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commission Management</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}><Ionicons name="settings-outline" size={24} color={COLORS.superAdmin.primary} /></TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statValue}>₹{stats.totalCommission.toLocaleString()}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>₹{stats.monthlyCommission.toLocaleString()}</Text><Text style={styles.statLabel}>This Month</Text></View>
      </View>

      <FlatList
        data={commissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommissionCard commission={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchCommissionData} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && <View style={styles.emptyContainer}><Ionicons name="trending-up-outline" size={64} color={COLORS.textSecondary} /><Text style={styles.emptyText}>No completed trips yet</Text></View>}
      />

      {/* Settings Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Commission Settings</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Vendor Commission</Text>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                {[COMMISSION_TYPES.PERCENTAGE, COMMISSION_TYPES.FIXED].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, commissionSettings.vendor_commission_type === type && styles.typeButtonActive]}
                    onPress={() => setCommissionSettings(p => ({ ...p, vendor_commission_type: type }))}
                  >
                    <Text style={[styles.typeButtonText, commissionSettings.vendor_commission_type === type && { color: COLORS.textLight }]}>
                      {type === COMMISSION_TYPES.PERCENTAGE ? 'Percentage' : 'Fixed Amount'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder={commissionSettings.vendor_commission_type === COMMISSION_TYPES.PERCENTAGE ? 'Percentage (%)' : 'Amount (₹)'}
                placeholderTextColor={COLORS.textSecondary}
                value={commissionSettings.vendor_commission_value.toString()}
                onChangeText={t => setCommissionSettings(p => ({ ...p, vendor_commission_value: parseFloat(t) || 0 }))}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={async () => { 
              try {
                const { error } = await supabase
                  .from('app_settings')
                  .update({
                    vendor_commission_type: commissionSettings.vendor_commission_type,
                    vendor_commission_value: commissionSettings.vendor_commission_value,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', 'global');
                
                if (error) throw error;
                console.log('✅ Commission settings saved:', commissionSettings);
                Alert.alert('✅ Saved', 'Vendor commission settings saved successfully');
                setModalVisible(false);
              } catch (err) {
                console.error('Error saving commission settings:', err);
                Alert.alert('Error', 'Failed to save commission settings: ' + err.message);
              }
            }}>
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: getResponsivePadding(24), marginTop: 16, marginBottom: 4 },
  statCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, flex: 0.48, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: getResponsiveFontSize(18), fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  statLabel: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary, textAlign: 'center' },
  listContainer: { paddingHorizontal: getResponsivePadding(24), paddingTop: 16, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripId: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  tripDate: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary },
  commissionAmount: { alignItems: 'flex-end' },
  commissionValue: { fontSize: getResponsiveFontSize(18), fontWeight: 'bold', color: COLORS.superAdmin.primary },
  commissionLabel: { fontSize: getResponsiveFontSize(10), color: COLORS.textSecondary },
  tripDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  detailValue: { fontSize: getResponsiveFontSize(14), color: COLORS.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  breakdown: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  breakdownItem: { alignItems: 'center' },
  breakdownLabel: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary, marginBottom: 4 },
  breakdownValue: { fontSize: getResponsiveFontSize(14), fontWeight: '600', color: COLORS.text },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: getResponsiveFontSize(16), color: COLORS.textSecondary, marginTop: 16 },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  modalContent: { flex: 1, padding: getResponsivePadding(24) },
  settingSection: { marginBottom: 32 },
  sectionTitle: { fontSize: getResponsiveFontSize(18), fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  typeButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, alignItems: 'center' },
  typeButtonActive: { backgroundColor: COLORS.superAdmin.primary, borderColor: COLORS.superAdmin.primary },
  typeButtonText: { fontSize: getResponsiveFontSize(13), color: COLORS.textSecondary, fontWeight: '500' },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, fontSize: getResponsiveFontSize(16), color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  saveButton: { backgroundColor: COLORS.superAdmin.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  saveButtonText: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.textLight },
});
