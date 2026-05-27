import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Alert, TextInput, ActivityIndicator, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../constants';
import { getResponsiveFontSize, getResponsivePadding, hp } from '../utils/responsive';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Fallback: use expo-location geocoder if no Google key
async function geocodeWithGoogle(query) {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.status === 'OK' && json.results.length > 0) {
      return json.results.map(r => ({
        name: r.formatted_address,
        latitude: r.geometry.location.lat,
        longitude: r.geometry.location.lng,
      }));
    }
  } catch (e) {
    console.warn('Google geocode failed:', e.message);
  }
  return null;
}

async function reverseGeocodeWithGoogle(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.status === 'OK' && json.results.length > 0) {
      return json.results[0].formatted_address;
    }
  } catch (e) {
    console.warn('Google reverse geocode failed:', e.message);
  }
  return null;
}

export default function LocationPickerModal({
  visible,
  onClose,
  onLocationSelect,
  title = 'Select Location',
}) {
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);   // tapped/dragged pin
  const [pinAddress, setPinAddress] = useState('');
  const [resolving, setResolving] = useState(false);      // reverse geocoding
  const [region, setRegion] = useState({
    latitude: 12.9716,   // Bangalore default
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // On open: get current location and center map
  useEffect(() => {
    if (!visible) return;
    setSearchQuery('');
    setSearchResults([]);
    setPinLocation(null);
    setPinAddress('');
    centerOnCurrentLocation();
  }, [visible]);

  const centerOnCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 600);
    } catch (e) {
      console.warn('Could not get current location:', e.message);
    }
  };

  // When user taps the map — drop a pin and reverse geocode
  const handleMapPress = useCallback(async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPinLocation({ latitude, longitude });
    
    // Don't reverse geocode - keep the original address if it exists
    // Only reverse geocode if there's no search query
    if (!searchQuery.trim()) {
      setPinAddress('');
      setResolving(true);

      try {
        // Try Google first, fall back to expo-location
        let address = await reverseGeocodeWithGoogle(latitude, longitude);
        if (!address) {
          const results = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (results.length > 0) {
            const r = results[0];
            address = [r.name, r.street, r.district, r.city, r.region]
              .filter(Boolean).join(', ');
          }
        }
        setPinAddress(address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } catch (e) {
        setPinAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } finally {
        setResolving(false);
      }
    } else {
      // If there's a search query, keep it as the address
      setPinAddress(searchQuery);
    }
  }, [searchQuery]);

  // Search by text
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      // Try Google Places geocoding first
      let results = await geocodeWithGoogle(searchQuery);

      // Fallback to expo-location geocoder
      if (!results) {
        const geocoded = await Location.geocodeAsync(searchQuery);
        results = await Promise.all(
          geocoded.slice(0, 5).map(async (loc) => {
            let name = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
            try {
              const rev = await Location.reverseGeocodeAsync(loc);
              if (rev.length > 0) {
                const r = rev[0];
                name = [r.name, r.street, r.district, r.city, r.region]
                  .filter(Boolean).join(', ');
              }
            } catch (_) {}
            return { name, latitude: loc.latitude, longitude: loc.longitude };
          })
        );
      }

      if (results && results.length > 0) {
        setSearchResults(results);
        // Pan map to first result
        const first = results[0];
        mapRef.current?.animateToRegion({
          latitude: first.latitude,
          longitude: first.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 600);
      } else {
        Alert.alert('Not Found', 'No results found. Try a different search term.');
      }
    } catch (e) {
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Select a search result — drop pin on it
  const selectSearchResult = useCallback((item) => {
    setPinLocation({ latitude: item.latitude, longitude: item.longitude });
    setPinAddress(item.name);
    setSearchResults([]);
    setSearchQuery(item.name);
    mapRef.current?.animateToRegion({
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 600);
  }, []);

  // Confirm the pinned location
  const confirmLocation = useCallback(() => {
    if (!pinLocation) {
      Alert.alert('No Location', 'Tap on the map to select a location first.');
      return;
    }
    onLocationSelect({
      name: pinAddress || `${pinLocation.latitude.toFixed(5)}, ${pinLocation.longitude.toFixed(5)}`,
      latitude: pinLocation.latitude,
      longitude: pinLocation.longitude,
    });
    onClose();
  }, [pinLocation, pinAddress, onLocationSelect, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
              {searching
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="search" size={20} color="#fff" />
              }
            </TouchableOpacity>
          </View>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <View style={styles.resultsDropdown}>
              <FlatList
                data={searchResults}
                keyExtractor={(_, i) => i.toString()}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem} onPress={() => selectSearchResult(item)}>
                    <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.resultText} numberOfLines={2}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </KeyboardAvoidingView>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {pinLocation && (
              <Marker
                coordinate={pinLocation}
                draggable
                onDragEnd={handleMapPress}
              >
                <View style={styles.pinMarker}>
                  <Ionicons name="location" size={28} color={COLORS.primary} />
                </View>
              </Marker>
            )}
          </MapView>

          {/* My location button */}
          <TouchableOpacity style={styles.myLocationBtn} onPress={centerOnCurrentLocation}>
            <Ionicons name="navigate" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Tap hint */}
          {!pinLocation && (
            <View style={styles.tapHint}>
              <Ionicons name="hand-left-outline" size={16} color="#fff" />
              <Text style={styles.tapHintText}>Tap on the map to select a location</Text>
            </View>
          )}
        </View>

        {/* Selected location bar + confirm */}
        <View style={styles.footer}>
          {pinLocation ? (
            <>
              <View style={styles.selectedLocation}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  {resolving
                    ? <ActivityIndicator size="small" color={COLORS.primary} />
                    : <Text style={styles.selectedAddress} numberOfLines={2}>
                        {pinAddress || `${pinLocation.latitude.toFixed(5)}, ${pinLocation.longitude.toFixed(5)}`}
                      </Text>
                  }
                </View>
              </View>
              <TouchableOpacity
                style={[styles.confirmBtn, resolving && { opacity: 0.6 }]}
                onPress={confirmLocation}
                disabled={resolving}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Confirm Location</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.footerHint}>
              Search or tap the map to pick a location
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: hp(6),
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: getResponsiveFontSize(18), fontWeight: '600', color: COLORS.text },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(15),
    color: COLORS.text,
    paddingVertical: 2,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsDropdown: {
    backgroundColor: COLORS.surface,
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 4,
    zIndex: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 10,
  },
  resultText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    color: COLORS.text,
  },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  pinMarker: { alignItems: 'center' },
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tapHint: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tapHintText: { color: '#fff', fontSize: getResponsiveFontSize(13) },
  footer: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedAddress: {
    fontSize: getResponsiveFontSize(14),
    color: COLORS.text,
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  footerHint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: getResponsiveFontSize(14),
    paddingVertical: 8,
  },
});
