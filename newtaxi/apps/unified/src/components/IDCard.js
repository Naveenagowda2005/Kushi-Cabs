import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Professional ID Card Component
 * Format: KUSH_[D/V][SerialNumber]
 * Shows: Photo, Name, Phone, ID, Approval Status, License/Vehicle, Logo
 */
export default function IDCard({ 
  userType = 'driver', // 'driver' or 'vendor'
  fullName, 
  phone, 
  photo, // base64 or uri (from avatar_base64)
  documentPhoto, // fallback photo from documents (DRIVER_SELFIE or VENDOR_SELFIE)
  licenseNumber, 
  vehicleNumber,
  serialNumber = 12345, // unique serial from database
  isApproved = false,
  companyName,
}) {
  const accountTypeCode = userType === 'driver' ? 'D' : 'V';
  const uniqueID = `KUSH${accountTypeCode}${String(serialNumber).padStart(6, '0')}`;
  
  // Try avatar_base64 first, then fallback to documentPhoto
  let photoUri = null;
  const photoData = photo || documentPhoto;
  
  if (photoData) {
    photoUri = photoData.startsWith('data:') 
      ? photoData 
      : `data:image/jpeg;base64,${photoData}`;
  }

  return (
    <View style={styles.cardContainer}>
      {/* Card Background */}
      <View style={[styles.card, userType === 'driver' ? styles.driverCard : styles.vendorCard]}>
        
        {/* Header Section - Logo & Status */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image 
              source={require('../../app.icon.jpeg')}
              style={styles.logoImage}
            />
            <Text style={styles.appName}>Kushi Cabs</Text>
          </View>
          
          {isApproved && (
            <View style={styles.approvalBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              <Text style={styles.approvalText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Middle Section - Photo & Basic Info */}
        <View style={styles.middleSection}>
          {/* Photo */}
          <View style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons 
                  name={userType === 'driver' ? 'person' : 'briefcase'} 
                  size={40} 
                  color="#ccc" 
                />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.name} numberOfLines={2}>{fullName}</Text>
            <Text style={styles.accountType}>
              {userType === 'driver' ? 'Driver' : 'Vendor'}
            </Text>
            
            {/* Unique ID */}
            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>ID</Text>
              <Text style={styles.idValue}>{uniqueID}</Text>
            </View>

            {/* Phone */}
            <View style={styles.detailRow}>
              <Ionicons name="call" size={12} color="#fff" />
              <Text style={styles.detail}>{phone}</Text>
            </View>

            {/* Company Name (Vendor only) */}
            {userType === 'vendor' && companyName && (
              <View style={styles.detailRow}>
                <Ionicons name="business" size={12} color="#fff" />
                <Text style={styles.detail} numberOfLines={1}>{companyName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Section - License/Vehicle Details */}
        <View style={styles.bottomSection}>
          {licenseNumber && (
            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>
                {userType === 'driver' ? 'License' : 'ID'}
              </Text>
              <Text style={styles.detailBoxValue}>{licenseNumber}</Text>
            </View>
          )}

          {vehicleNumber && (
            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>Vehicle</Text>
              <Text style={styles.detailBoxValue}>{vehicleNumber}</Text>
            </View>
          )}
        </View>

        {/* Footer - Security Line */}
        <View style={styles.footer}>
          <View style={styles.securityLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },

  driverCard: {
    backgroundColor: '#1a472a', // Dark green for driver
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },

  vendorCard: {
    backgroundColor: '#2a1a47', // Dark purple for vendor
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },

  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4caf5030',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },

  approvalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4caf50',
  },

  /* Middle Section */
  middleSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoSection: {
    flex: 1,
    justifyContent: 'space-between',
  },

  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },

  accountType: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  idContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },

  idLabel: {
    fontSize: 10,
    color: '#aaa',
    marginBottom: 2,
  },

  idValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  detail: {
    fontSize: 11,
    color: '#ddd',
    flex: 1,
  },

  /* Bottom Section */
  bottomSection: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },

  detailBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },

  detailBoxLabel: {
    fontSize: 9,
    color: '#aaa',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  detailBoxValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },

  /* Footer */
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },

  securityLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
  },
});
