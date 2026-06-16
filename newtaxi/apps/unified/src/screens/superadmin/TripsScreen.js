import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Linking, Image, Modal, ScrollView,
  PanResponder, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';

// Zoomable Image Component with simple zoom controls
function ZoomableImage({ imageUrl, title }) {
  const [scale, setScale] = useState(1);
  const maxScale = 3;
  const minScale = 1;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, maxScale));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, minScale));
  };

  const handleReset = () => {
    setScale(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: '100%',
            height: '100%',
            transform: [{ scale }],
          }}
          resizeMode="contain"
        />
      </View>
      
      {/* Zoom Controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555' }}
          onPress={handleZoomOut}
          disabled={scale === minScale}
        >
          <Ionicons name="remove" size={20} color={scale === minScale ? '#666' : '#fff'} />
        </TouchableOpacity>
        
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', minWidth: 50, textAlign: 'center' }}>{Math.round(scale * 100)}%</Text>
        
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555' }}
          onPress={handleZoomIn}
          disabled={scale === maxScale}
        >
          <Ionicons name="add" size={20} color={scale === maxScale ? '#666' : '#fff'} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555', marginLeft: 8 }}
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Component to handle signed URL loading
function OdometerImageThumbnail({ imageUrl, tripId, imageType, onPress, isError, isLoading, onLoad, onError }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSignedUrl = async () => {
      try {
        if (!imageUrl) {
          setLoading(false);
          return;
        }

        // Extract file path from the URL
        const filePath = imageUrl.split('/odometer-images/')[1];
        if (!filePath) {
          console.warn('Could not extract file path from URL:', imageUrl);
          setLoading(false);
          return;
        }

        // Get signed URL from Supabase
        const { data, error } = await supabase.storage
          .from('odometer-images')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          // Silently fail for missing images (404 is expected)
          if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.log('Image not found in storage (expected):', filePath);
          } else {
            console.error('Error creating signed URL:', error);
          }
          setSignedUrl(null);
          onError?.();
          setLoading(false);
          return;
        }

        setSignedUrl(data?.signedUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error in getSignedUrl:', err);
        onError?.();
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [imageUrl]);

  return (
    <TouchableOpacity
      style={styles.odometerImageWrapper}
      onPress={() => {
        console.log('Thumbnail pressed, opening modal with signed URL:', signedUrl);
        onPress?.(signedUrl);
      }}
      disabled={isError}
    >
      {isError ? (
        <View style={[styles.odometerImage, styles.imageErrorPlaceholder]}>
          <Ionicons name="image-outline" size={32} color="#666" />
          <Text style={styles.errorText}>Failed to load</Text>
        </View>
      ) : loading || isLoading ? (
        <View style={[styles.odometerImage, styles.imageLoadingPlaceholder]}>
          <Ionicons name="hourglass-outline" size={32} color="#888" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : signedUrl ? (
        <Image
          source={{ uri: signedUrl }}
          style={styles.odometerImage}
          onLoad={onLoad}
          onError={onError}
        />
      ) : (
        <View style={[styles.odometerImage, styles.imageErrorPlaceholder]}>
          <Ionicons name="image-outline" size={32} color="#666" />
          <Text style={styles.errorText}>No URL</Text>
        </View>
      )}
      <Text style={styles.odometerLabel}>{imageType === 'start' ? 'Start' : 'End'}</Text>
    </TouchableOpacity>
  );
}
const STATUS_COLOR = {
  completed: '#4caf50',
  cancelled: '#f44336',
  in_progress: '#9c27b0',
  accepted: '#2196f3',
  pending: '#ff9800',
};

export default function SuperAdminTripsScreen() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, accepted, in_progress, completed, cancelled
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [modalSignedUrl, setModalSignedUrl] = useState(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('trips')
        .select(`
          id,
          status,
          fare_amount,
          pickup_location,
          dropoff_location,
          start_km,
          end_km,
          start_odometer_url,
          end_odometer_url,
          created_at,
          accepted_at,
          started_at,
          completed_at,
          creator:created_by(full_name, phone),
          driver:accepted_by(full_name, phone)
        `);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error('Error fetching trips:', err.message);
      Alert.alert('Error', 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  const openImageModal = (imageUrl, title) => {
    console.log('Opening image modal:', { imageUrl, title });
    setModalSignedUrl(null); // Reset signed URL
    setSelectedImage({ url: imageUrl, title });
    setImageModalVisible(true);
    
    // Generate signed URL for modal
    generateSignedUrlForModal(imageUrl);
  };

  const generateSignedUrlForModal = async (imageUrl) => {
    try {
      if (!imageUrl) {
        console.warn('No image URL provided');
        return;
      }

      console.log('Generating signed URL for:', imageUrl);

      // Extract file path from the URL
      const filePath = imageUrl.split('/odometer-images/')[1];
      if (!filePath) {
        console.warn('Could not extract file path from URL:', imageUrl);
        return;
      }

      console.log('File path extracted:', filePath);

      // Get signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('odometer-images')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        // Silently fail for missing images (404 is expected)
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log('Image not found in storage (expected):', filePath);
        } else {
          console.error('Error creating signed URL for modal:', error);
        }
        return;
      }

      console.log('Signed URL generated successfully');
      setModalSignedUrl(data?.signedUrl);
    } catch (err) {
      console.error('Error in generateSignedUrlForModal:', err);
    }
  };

  const handleImageLoad = (tripId, imageType) => {
    console.log(`Image loaded successfully: ${tripId}-${imageType}`);
    setImageLoadingStates(prev => ({
      ...prev,
      [`${tripId}-${imageType}`]: 'loaded'
    }));
  };

  const handleImageLoadError = (tripId, imageType, error) => {
    console.warn(`Image failed to load: ${tripId}-${imageType}`, error);
    setImageLoadingStates(prev => ({
      ...prev,
      [`${tripId}-${imageType}`]: 'error'
    }));
    setImageLoadErrors(prev => ({
      ...prev,
      [`${tripId}-${imageType}`]: true
    }));
  };

  const verifyImageUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`URL verification for ${url}: ${response.status}`);
      return response.ok;
    } catch (err) {
      console.error(`URL verification failed for ${url}:`, err.message);
      return false;
    }
  };

  const getImageUrl = (storagePath) => {
    if (!storagePath) return null;
    
    // URLs are already stored as complete public URLs from Supabase
    // Just return them directly
    return storagePath;
  };

  const getSignedImageUrl = async (storagePath) => {
    if (!storagePath) return null;
    
    try {
      // If it's already a full URL, try to use it as-is first
      if (storagePath.startsWith('http')) {
        return storagePath;
      }
      
      // Extract just the file path
      const filePath = storagePath.split('/odometer-images/')[1] || storagePath;
      
      // Get signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('odometer-images')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        // Silently fail for missing images (404 is expected)
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log('Image not found in storage (expected):', filePath);
        } else {
          console.error('Error creating signed URL:', error);
        }
        return storagePath; // Fallback to original
      }

      return data?.signedUrl || storagePath;
    } catch (err) {
      console.error('Error in getSignedImageUrl:', err);
      return storagePath;
    }
  };

  const renderTrip = ({ item }) => {
    const color = STATUS_COLOR[item.status] ?? '#888';
    const distance = item.end_km && item.start_km
      ? `${(item.end_km - item.start_km).toFixed(1)} km`
      : 'N/A';

    // Debug logging
    if (item.start_odometer_url || item.end_odometer_url) {
      console.log(`Trip ${item.id.slice(0, 8)}: start_odometer_url=${item.start_odometer_url}, end_odometer_url=${item.end_odometer_url}`);
      // Verify URLs
      if (item.start_odometer_url) verifyImageUrl(item.start_odometer_url);
      if (item.end_odometer_url) verifyImageUrl(item.end_odometer_url);
    }

    return (
      <View style={styles.tripCard}>
        {/* Header */}
        <View style={styles.tripHeader}>
          <View style={styles.tripHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <View>
              <Text style={[styles.status, { color }]}>
                {item.status.toUpperCase()}
              </Text>
              <Text style={styles.tripId}>ID: {item.id.slice(0, 8)}</Text>
            </View>
          </View>
          <Text style={styles.fare}>₹{item.fare_amount}</Text>
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#4caf50" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickup_location}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={14} color="#e94560" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoff_location}
            </Text>
          </View>
        </View>

        {/* Creator/Vendor Info */}
        {item.creator && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Created By (Vendor)</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={16} color="#4caf50" />
              <Text style={styles.infoText}>{item.creator.full_name}</Text>
            </View>
            {item.creator.phone && (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => Linking.openURL(`tel:${item.creator.phone}`)}
              >
                <Ionicons name="call-outline" size={14} color="#2196f3" />
                <Text style={styles.phoneText}>{item.creator.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Driver Info */}
        {item.driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accepted By (Driver)</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={16} color="#2196f3" />
              <Text style={styles.infoText}>{item.driver.full_name}</Text>
            </View>
            {item.driver.phone && (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => Linking.openURL(`tel:${item.driver.phone}`)}
              >
                <Ionicons name="call-outline" size={14} color="#2196f3" />
                <Text style={styles.phoneText}>{item.driver.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Trip Details */}
        <View style={styles.section}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{distance}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start KM:</Text>
            <Text style={styles.detailValue}>{item.start_km || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End KM:</Text>
            <Text style={styles.detailValue}>{item.end_km || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Odometer Images */}
        {(item.start_odometer_url || item.end_odometer_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Odometer Images</Text>
            <View style={styles.odometerContainer}>
              {item.start_odometer_url && (
                <OdometerImageThumbnail
                  imageUrl={item.start_odometer_url}
                  tripId={item.id}
                  imageType="start"
                  onPress={() => openImageModal(item.start_odometer_url, 'Start Odometer')}
                  isError={imageLoadErrors[`${item.id}-start`]}
                  isLoading={imageLoadingStates[`${item.id}-start`] === 'loading'}
                  onLoad={() => handleImageLoad(item.id, 'start')}
                  onError={() => handleImageLoadError(item.id, 'start')}
                />
              )}
              {item.end_odometer_url && (
                <OdometerImageThumbnail
                  imageUrl={item.end_odometer_url}
                  tripId={item.id}
                  imageType="end"
                  onPress={() => openImageModal(item.end_odometer_url, 'End Odometer')}
                  isError={imageLoadErrors[`${item.id}-end`]}
                  isLoading={imageLoadingStates[`${item.id}-end`] === 'loading'}
                  onLoad={() => handleImageLoad(item.id, 'end')}
                  onError={() => handleImageLoadError(item.id, 'end')}
                />
              )}
            </View>
          </View>
        )}

        {/* Timestamps */}
        {(item.accepted_at || item.started_at || item.completed_at) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {item.accepted_at && (
              <Text style={styles.timestamp}>
                ✓ Accepted: {new Date(item.accepted_at).toLocaleString()}
              </Text>
            )}
            {item.started_at && (
              <Text style={styles.timestamp}>
                ✓ Started: {new Date(item.started_at).toLocaleString()}
              </Text>
            )}
            {item.completed_at && (
              <Text style={styles.timestamp}>
                ✓ Completed: {new Date(item.completed_at).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Publish to Drivers Button */}
        {item.status === 'pending' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.publishButton,
                item.is_published && styles.publishButtonActive
              ]}
              onPress={() => {
                Alert.alert(
                  item.is_published ? 'Unpublish Trip' : 'Publish Trip',
                  item.is_published 
                    ? 'Remove this trip from driver visibility?'
                    : 'Make this trip visible to all drivers?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: item.is_published ? 'Unpublish' : 'Publish',
                      onPress: async () => {
                        try {
                          const { error } = await supabase
                            .from('trips')
                            .update({ is_published: !item.is_published })
                            .eq('id', item.id);

                          if (error) throw error;
                          
                          // Update local state immediately for instant UI feedback
                          setTrips(prevTrips =>
                            prevTrips.map(trip =>
                              trip.id === item.id
                                ? { ...trip, is_published: !trip.is_published }
                                : trip
                            )
                          );
                          
                          // Show different message based on current published state
                          const successMsg = item.is_published 
                            ? 'Trip unpublished successfully' 
                            : 'Trip published to drivers';
                          Alert.alert('Success', successMsg);
                        } catch (err) {
                          Alert.alert('Error', err.message);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons 
                name={item.is_published ? 'eye-outline' : 'eye-off-outline'} 
                size={16} 
                color={item.is_published ? '#4caf50' : '#ff9800'} 
              />
              <Text style={[
                styles.publishButtonText,
                item.is_published && styles.publishButtonTextActive
              ]}>
                {item.is_published ? 'Published to Drivers' : 'Publish to Drivers'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Trips</Text>
        <Text style={styles.subtitle}>Total: {trips.length}</Text>
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Trips List */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchTrips}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptySubtitle}>
                Trips will appear here once created
              </Text>
            </View>
          )
        }
      />

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setImageModalVisible(false);
          setModalSignedUrl(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedImage?.title}</Text>
            <TouchableOpacity onPress={() => {
              setImageModalVisible(false);
              setModalSignedUrl(null);
            }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          {modalSignedUrl ? (
            <ZoomableImage imageUrl={modalSignedUrl} title={selectedImage?.title} />
          ) : (
            <View style={styles.loadingContainer}>
              <Ionicons name="hourglass-outline" size={48} color="#888" />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
    opacity: 0.8,
  },
  filterContainer: {
    backgroundColor: '#16213e',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#0f3460',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.textLight,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  tripCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  tripId: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  fare: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  locationText: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  phoneText: {
    color: '#2196f3',
    fontSize: 13,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#888',
    fontSize: 13,
  },
  detailValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    color: '#4caf50',
    fontSize: 12,
    marginBottom: 4,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#ff980011',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  publishButtonActive: {
    backgroundColor: '#4caf5011',
    borderColor: '#4caf50',
  },
  publishButtonText: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '600',
  },
  publishButtonTextActive: {
    color: '#4caf50',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  odometerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  odometerImageWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  odometerImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#0f3460',
    marginBottom: 8,
  },
  imageErrorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  loadingText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  odometerLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-start',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: 400,
  },
  zoomableContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  zoomableImageWrapper: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableImage: {
    width: '100%',
    height: '100%',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  resetButton: {
    marginLeft: 8,
  },
  zoomLevel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 10,
    color: '#888',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
});
