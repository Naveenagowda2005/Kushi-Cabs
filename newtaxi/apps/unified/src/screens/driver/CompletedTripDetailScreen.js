import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Alert, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CompletedTripDetailScreen({ route, navigation }) {
  const { trip } = route.params;
  const [selectedImage, setSelectedImage] = React.useState(null);

  // Debug logging
  console.log('🔍 CompletedTripDetailScreen trip data:', {
    trip_id: trip?.id,
    has_driver: !!trip?.driver,
    driver_data: trip?.driver,
    passenger_name: trip?.passenger_name,
    passenger_phone: trip?.passenger_phone,
    start_odometer_url: trip?.start_odometer_url,
    end_odometer_url: trip?.end_odometer_url,
  });

  const fareAmount = trip.fare_amount || 0;
  const commissionAmount = trip.commission_amount || 0;
  const customerPreAdvance = trip.customer_pre_advance || 0;
  const driverEarning = fareAmount - commissionAmount;
  const collectedFromPassenger = fareAmount - customerPreAdvance;
  const collectedFromCreator = fareAmount - customerPreAdvance - commissionAmount;

  function handleCallPassenger() {
    if (!trip.passenger_phone) {
      Alert.alert('No Contact', 'Passenger phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${trip.passenger_phone}`);
  }

  function DetailRow({ label, value, color = '#333' }) {
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: '#ffffff' }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
            <Text style={styles.statusText}>Completed</Text>
          </View>
        </View>

        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="location" size={16} color="#4caf50" />
            <Text style={styles.summaryLocation} numberOfLines={2}>{trip.pickup_location}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Ionicons name="flag" size={16} color="#333" />
            <Text style={styles.summaryLocation} numberOfLines={2}>{trip.dropoff_location}</Text>
          </View>
          {trip.return_location && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Ionicons name="return-up-back-outline" size={16} color="#ff9800" />
                <Text style={styles.summaryLocation} numberOfLines={2}>{trip.return_location}</Text>
              </View>
            </>
          )}
        </View>

        {/* Fare Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Breakdown</Text>
          <DetailRow label="Total Fare" value={`₹${fareAmount.toFixed(2)}`} />
          {commissionAmount > 0 && (
            <DetailRow label="Commission:" value={`-₹${commissionAmount.toFixed(2)}`} color="#ff6b6b" />
          )}
          {customerPreAdvance > 0 && (
            <DetailRow label="Customer Pre-Advance" value={`₹${customerPreAdvance.toFixed(2)}`} color="#2196f3" />
          )}
          <View style={styles.divider} />
          <DetailRow label="Total Driver Earnings" value={`₹${driverEarning.toFixed(2)}`} color="#4caf50" />
        </View>

        {/* Trip Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Information</Text>
          <DetailRow 
            label="Trip Date" 
            value={trip.created_at ? new Date(trip.created_at).toLocaleString() : 'N/A'} 
          />
          {trip.completed_at && (
            <DetailRow 
              label="Completed At" 
              value={new Date(trip.completed_at).toLocaleString()} 
            />
          )}
          {trip.start_km && trip.end_km && (
            <DetailRow 
              label="Distance Covered" 
              value={`${(trip.end_km - trip.start_km).toFixed(2)} km`} 
            />
          )}
        </View>

        {/* Odometer Details */}
        {(trip.start_km || trip.end_km) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Odometer Reading</Text>
            {trip.start_km && <DetailRow label="Start KM" value={`${trip.start_km.toFixed(2)} km`} />}
            {trip.end_km && <DetailRow label="End KM" value={`${trip.end_km.toFixed(2)} km`} />}
            {trip.start_km && trip.end_km && (
              <DetailRow 
                label="Total Distance" 
                value={`${(trip.end_km - trip.start_km).toFixed(2)} km`} 
                color="#2196f3"
              />
            )}
          </View>
        )}

        {/* Customer Details */}
        {trip.passenger_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <DetailRow label="Name" value={trip.passenger_name} />
            {trip.passenger_phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <TouchableOpacity onPress={handleCallPassenger}>
                  <View style={styles.phoneButton}>
                    <Ionicons name="call-outline" size={14} color="#fff" />
                    <Text style={styles.phoneButtonText}>{trip.passenger_phone}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Driver Details */}
        {trip.driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Details</Text>
            {trip.driver.users?.full_name && (
              <DetailRow label="Name" value={trip.driver.users.full_name} />
            )}
            {trip.driver.users?.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${trip.driver.users.phone}`)}>
                  <View style={styles.phoneButton}>
                    <Ionicons name="call-outline" size={14} color="#fff" />
                    <Text style={styles.phoneButtonText}>{trip.driver.users.phone}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            {trip.driver.vehicle_number && (
              <DetailRow label="Vehicle" value={trip.driver.vehicle_number} color="#ff9800" />
            )}
            {trip.driver.license_number && (
              <DetailRow label="License" value={trip.driver.license_number} />
            )}
          </View>
        )}

        {/* Odometer Images */}
        {(trip.start_odometer_url || trip.end_odometer_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Odometer Images</Text>
            <View style={styles.odometerContainer}>
              {trip.start_odometer_url && (
                <TouchableOpacity 
                  style={styles.odometerImageWrapper}
                  onPress={() => setSelectedImage({ uri: trip.start_odometer_url, type: 'Start' })}
                >
                  <Image 
                    source={{ uri: trip.start_odometer_url }}
                    style={styles.odometerImage}
                  />
                  <Text style={styles.odometerLabel}>Start</Text>
                </TouchableOpacity>
              )}
              {trip.end_odometer_url && (
                <TouchableOpacity 
                  style={styles.odometerImageWrapper}
                  onPress={() => setSelectedImage({ uri: trip.end_odometer_url, type: 'End' })}
                >
                  <Image 
                    source={{ uri: trip.end_odometer_url }}
                    style={styles.odometerImage}
                  />
                  <Text style={styles.odometerLabel}>End</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-outline" size={32} color="#fff" />
            </TouchableOpacity>
            {selectedImage && (
              <>
                <Image 
                  source={{ uri: selectedImage.uri }}
                  style={styles.fullscreenImage}
                />
                <Text style={styles.imageTitle}>{selectedImage.type} Odometer</Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Back to History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: 16, paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 10 },
  headerTitle: { color: '#333', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: '#4caf50', fontSize: 12, fontWeight: '600' },

  summaryCard: { backgroundColor: '#f5f5f5', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e0e0e0' },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryLocation: { color: '#333', fontSize: 14, flex: 1, lineHeight: 20 },
  summaryDivider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 },

  section: { backgroundColor: '#f5f5f5', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  sectionTitle: { color: '#333', fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  detailLabel: { color: '#666', fontSize: 13 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 8 },

  phoneButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4caf50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  phoneButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  footer: { padding: 16, paddingBottom: 32, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  backBtn: { backgroundColor: '#4caf50', borderRadius: 12, padding: 16, alignItems: 'center' },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  odometerContainer: { flexDirection: 'row', gap: 12 },
  odometerImageWrapper: { flex: 1, alignItems: 'center' },
  odometerImage: { width: '100%', height: 150, borderRadius: 10, backgroundColor: '#e0e0e0' },
  odometerLabel: { color: '#333', fontSize: 12, fontWeight: '600', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  fullscreenImage: { width: '90%', height: '70%', borderRadius: 8 },
  imageTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 16 },
});
