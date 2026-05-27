import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Hardcoded coordinates for major Indian cities (fallback only when geocoding fails)
const LOCATION_COORDINATES = {
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'banglore': { lat: 12.9716, lng: 77.5946 }, // Common misspelling
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'mysore': { lat: 12.2958, lng: 76.6394 },
  'coimbatore': { lat: 11.0081, lng: 76.9877 },
  'visakhapatnam': { lat: 17.6869, lng: 83.2185 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1458, lng: 72.8336 },
  'vadodara': { lat: 22.3072, lng: 73.1812 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.1815, lng: 79.9864 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'thane': { lat: 19.2183, lng: 72.9781 },
  'navi mumbai': { lat: 19.0330, lng: 73.0297 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'faridabad': { lat: 28.4089, lng: 77.3178 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'amritsar': { lat: 31.6340, lng: 74.8723 },
  'ludhiana': { lat: 30.9010, lng: 75.8573 },
  'srinagar': { lat: 34.0837, lng: 74.7973 },
  'jammu': { lat: 32.7266, lng: 74.8570 },
  'shimla': { lat: 31.7725, lng: 77.1739 },
  'manali': { lat: 32.2396, lng: 77.1887 },
  'dehradun': { lat: 30.3165, lng: 78.0322 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'allahabad': { lat: 25.4358, lng: 81.8463 },
  'gorakhpur': { lat: 26.7606, lng: 83.3732 },
  'meerut': { lat: 28.9845, lng: 77.7064 },
  'bareilly': { lat: 28.3670, lng: 79.4304 },
  'aligarh': { lat: 27.8974, lng: 78.0880 },
  'moradabad': { lat: 28.8385, lng: 77.7597 },
  'saharanpur': { lat: 29.9683, lng: 77.5556 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
};

// Geocode location name to coordinates
async function geocodeLocation(locationName) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured');
    return null;
  }
  try {
    const encodedAddress = encodeURIComponent(locationName);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('Geocoding URL:', url.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
    
    const res = await fetch(url);
    const json = await res.json();
    
    console.log('Geocoding response status:', json.status);
    
    if (json.status === 'OK' && json.results.length > 0) {
      const { lat, lng } = json.results[0].geometry.location;
      console.log(`Geocoded "${locationName}" to:`, { lat, lng });
      return { lat, lng };
    } else {
      console.warn(`Geocoding failed for "${locationName}":`, json.status, json.error_message);
      // Try hardcoded fallback with full address
      const normalized = locationName.toLowerCase().trim();
      if (LOCATION_COORDINATES[normalized]) {
        console.log(`Using hardcoded coordinates for "${locationName}"`);
        return LOCATION_COORDINATES[normalized];
      }
      
      // Extract city name from address and try again
      const cityMatch = locationName.match(/(?:,\s*)([A-Za-z\s]+),\s*(?:Karnataka|Tamil Nadu|Telangana|Maharashtra|Delhi|Punjab|Haryana|Uttar Pradesh|Rajasthan|Gujarat|West Bengal|Odisha|Jharkhand|Chhattisgarh|Madhya Pradesh|Assam|Himachal Pradesh|Uttarakhand|Jammu and Kashmir|Ladakh)/i);
      if (cityMatch) {
        const cityName = cityMatch[1].toLowerCase().trim();
        console.log(`Extracted city from address: "${cityName}"`);
        if (LOCATION_COORDINATES[cityName]) {
          console.log(`Using hardcoded coordinates for extracted city: "${cityName}"`);
          return LOCATION_COORDINATES[cityName];
        }
      }
      
      // Try to find any known city in the address
      for (const [city, coords] of Object.entries(LOCATION_COORDINATES)) {
        if (locationName.toLowerCase().includes(city)) {
          console.log(`Found city "${city}" in address, using its coordinates`);
          return coords;
        }
      }
    }
  } catch (e) {
    console.error('Geocoding fetch error:', e.message);
    // Try hardcoded fallback
    const normalized = locationName.toLowerCase().trim();
    if (LOCATION_COORDINATES[normalized]) {
      console.log(`Using hardcoded coordinates for "${locationName}" (fallback)`);
      return LOCATION_COORDINATES[normalized];
    }
    
    // Extract city and try again
    for (const [city, coords] of Object.entries(LOCATION_COORDINATES)) {
      if (locationName.toLowerCase().includes(city)) {
        console.log(`Found city "${city}" in address (error fallback), using its coordinates`);
        return coords;
      }
    }
  }
  return null;
}

// Decode Google Directions encoded polyline
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

async function fetchRoute(originLat, originLng, destLat, destLng) {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.status === 'OK' && json.routes.length > 0) {
      const route = json.routes[0];
      const points = decodePolyline(route.overview_polyline.points);
      const leg = route.legs[0];
      return {
        points,
        distance: leg.distance.text,
        duration: leg.duration.text,
      };
    }
  } catch (e) {
    console.warn('Directions API failed:', e.message);
  }
  return null;
}

export default function NavigationMap({
  pickupLocation,
  dropoffLocation,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  returnLocation,
  returnLat,
  returnLng,
  passengerName,
  passengerPhone,
  onClose,
}) {
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);   // { distance, duration }
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [finalPickupLat, setFinalPickupLat] = useState(pickupLat);
  const [finalPickupLng, setFinalPickupLng] = useState(pickupLng);
  const [finalDropoffLat, setFinalDropoffLat] = useState(dropoffLat);
  const [finalDropoffLng, setFinalDropoffLng] = useState(dropoffLng);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [finalReturnLat, setFinalReturnLat] = useState(returnLat);
  const [finalReturnLng, setFinalReturnLng] = useState(returnLng);

  // Debug logging
  useEffect(() => {
    console.log('NavigationMap received props:', {
      pickupLocation,
      dropoffLocation,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    });
  }, [pickupLocation, dropoffLocation, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  useEffect(() => {
    initLocation();
    // Geocode locations if coordinates are missing
    geocodeIfNeeded();
  }, []);

  // Re-geocode if location names change
  useEffect(() => {
    geocodeIfNeeded();
  }, [pickupLocation, dropoffLocation, returnLocation]);

  const geocodeIfNeeded = async () => {
    setGeocodingInProgress(true);
    try {
      console.log('=== GEOCODING DEBUG ===');
      console.log('Pickup location:', pickupLocation);
      console.log('Dropoff location:', dropoffLocation);
      console.log('Pickup coords from DB:', { pickupLat, pickupLng });
      console.log('Dropoff coords from DB:', { dropoffLat, dropoffLng });

      // If we already have coordinates from DB, use them!
      if ((pickupLat && pickupLng) && (dropoffLat && dropoffLng)) {
        console.log('✅ Using coordinates from database');
        setFinalPickupLat(pickupLat);
        setFinalPickupLng(pickupLng);
        setFinalDropoffLat(dropoffLat);
        setFinalDropoffLng(dropoffLng);
        setGeocodingInProgress(false);
        return;
      }

      // Only geocode if we don't have coordinates
      if ((!pickupLat || !pickupLng) && pickupLocation) {
        console.log('Geocoding pickup:', pickupLocation);
        const coords = await geocodeLocation(pickupLocation);
        if (coords) {
          console.log('Pickup geocoded:', coords);
          setFinalPickupLat(coords.lat);
          setFinalPickupLng(coords.lng);
        } else {
          console.warn('Failed to geocode pickup:', pickupLocation);
        }
      } else if (pickupLat && pickupLng) {
        setFinalPickupLat(pickupLat);
        setFinalPickupLng(pickupLng);
      }

      if ((!dropoffLat || !dropoffLng) && dropoffLocation) {
        console.log('Geocoding dropoff:', dropoffLocation);
        const coords = await geocodeLocation(dropoffLocation);
        if (coords) {
          console.log('Dropoff geocoded:', coords);
          setFinalDropoffLat(coords.lat);
          setFinalDropoffLng(coords.lng);
        } else {
          console.warn('Failed to geocode dropoff:', dropoffLocation);
        }
      } else if (dropoffLat && dropoffLng) {
        setFinalDropoffLat(dropoffLat);
        setFinalDropoffLng(dropoffLng);
      }

      // Geocode return location if it exists
      if (returnLocation && (!returnLat || !returnLng)) {
        console.log('Geocoding return location:', returnLocation);
        const coords = await geocodeLocation(returnLocation);
        if (coords) {
          console.log('Return location geocoded:', coords);
          setFinalReturnLat(coords.lat);
          setFinalReturnLng(coords.lng);
        } else {
          console.warn('Failed to geocode return location:', returnLocation);
        }
      } else if (returnLat && returnLng) {
        setFinalReturnLat(returnLat);
        setFinalReturnLng(returnLng);
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    } finally {
      setGeocodingInProgress(false);
    }
  };

  const initLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch (e) {
      console.warn('Location error:', e.message);
    }
  };

  // Fetch route when both coords are available
  useEffect(() => {
    if (finalPickupLat && finalPickupLng && finalDropoffLat && finalDropoffLng) {
      loadRoute();
    }
  }, [finalPickupLat, finalPickupLng, finalDropoffLat, finalDropoffLng]);

  const loadRoute = async () => {
    setLoadingRoute(true);
    const result = await fetchRoute(finalPickupLat, finalPickupLng, finalDropoffLat, finalDropoffLng);
    if (result) {
      setRoutePoints(result.points);
      setRouteInfo({ distance: result.distance, duration: result.duration });
    }
    setLoadingRoute(false);
  };

  // Fit map to show all markers
  const fitToMarkers = useCallback(() => {
    if (!mapRef.current) return;
    const coords = [];
    if (currentLocation) coords.push(currentLocation);
    if (finalPickupLat && finalPickupLng) coords.push({ latitude: finalPickupLat, longitude: finalPickupLng });
    if (finalDropoffLat && finalDropoffLng) coords.push({ latitude: finalDropoffLat, longitude: finalDropoffLng });
    if (coords.length > 0) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [currentLocation, finalPickupLat, finalPickupLng, finalDropoffLat, finalDropoffLng]);

  // Auto-fit once route loads
  useEffect(() => {
    if (routePoints.length > 0) {
      setTimeout(fitToMarkers, 500);
    }
  }, [routePoints]);

  const openInGoogleMaps = (lat, lng, label) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const openFullRoute = () => {
    if (!finalPickupLat || !finalDropoffLat) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${finalPickupLat},${finalPickupLng}&destination=${finalDropoffLat},${finalDropoffLng}&travelmode=driving`;
    Linking.openURL(url);
  };

  const initialRegion = {
    latitude: finalPickupLat || currentLocation?.latitude || 12.9716,
    longitude: finalPickupLng || currentLocation?.longitude || 77.5946,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
        <TouchableOpacity onPress={fitToMarkers} style={styles.headerBtn}>
          <Ionicons name="resize" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Route info bar */}
      {routeInfo && (
        <View style={styles.routeBar}>
          <View style={styles.routeItem}>
            <Ionicons name="car-outline" size={16} color="#fff" />
            <Text style={styles.routeText}>{routeInfo.distance}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeItem}>
            <Ionicons name="time-outline" size={16} color="#fff" />
            <Text style={styles.routeText}>{routeInfo.duration}</Text>
          </View>
          <TouchableOpacity style={styles.openMapsBtn} onPress={openFullRoute}>
            <Ionicons name="navigate" size={14} color="#fff" />
            <Text style={styles.openMapsText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsTraffic
        >
          {/* Route polyline */}
          {routePoints.length > 0 && (
            <Polyline
              coordinates={routePoints}
              strokeColor="#e94560"
              strokeWidth={4}
              lineDashPattern={[0]}
            />
          )}

          {/* Pickup marker */}
          {finalPickupLat && finalPickupLng && (
            <Marker coordinate={{ latitude: finalPickupLat, longitude: finalPickupLng }} title="Pickup" description={pickupLocation}>
              <View style={[styles.markerBubble, { backgroundColor: '#4caf50' }]}>
                <Ionicons name="location" size={18} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Dropoff marker */}
          {finalDropoffLat && finalDropoffLng && (
            <Marker coordinate={{ latitude: finalDropoffLat, longitude: finalDropoffLng }} title="Drop-off" description={dropoffLocation}>
              <View style={[styles.markerBubble, { backgroundColor: '#e94560' }]}>
                <Ionicons name="flag" size={18} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Loading overlay */}
        {loadingRoute && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#e94560" />
            <Text style={styles.loadingText}>Loading route...</Text>
          </View>
        )}

        {/* My location FAB */}
        <TouchableOpacity style={styles.myLocBtn} onPress={fitToMarkers}>
          <Ionicons name="navigate-outline" size={22} color="#e94560" />
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#4caf50" />
          <Text style={styles.locationText} numberOfLines={1}>{pickupLocation || 'Pickup'}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="flag" size={14} color="#e94560" />
          <Text style={styles.locationText} numberOfLines={1}>{dropoffLocation || 'Drop-off'}</Text>
        </View>

        {/* Customer Details */}
        {(passengerName || passengerPhone) && (
          <View style={styles.customerDetailsBox}>
            <Text style={styles.customerDetailsTitle}>Customer Details</Text>
            {passengerName && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={14} color="#2196f3" />
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{passengerName}</Text>
              </View>
            )}
            {passengerPhone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={14} color="#2196f3" />
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{passengerPhone}</Text>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${passengerPhone}`)}
                >
                  <Ionicons name="call" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: '#4caf50' }, (!finalPickupLat || !finalPickupLng) && styles.disabledBtn]}
            onPress={() => {
              if (finalPickupLat && finalPickupLng) {
                openInGoogleMaps(finalPickupLat, finalPickupLng, pickupLocation);
              } else {
                Alert.alert('Location Missing', 'Pickup location coordinates could not be determined.');
              }
            }}
          >
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text style={styles.navBtnText}>Go to Pickup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: '#e94560' }, (!finalDropoffLat || !finalDropoffLng) && styles.disabledBtn]}
            onPress={() => {
              if (finalDropoffLat && finalDropoffLng) {
                openInGoogleMaps(finalDropoffLat, finalDropoffLng, dropoffLocation);
              } else {
                Alert.alert('Location Missing', 'Drop-off location coordinates could not be determined.');
              }
            }}
          >
            <Ionicons name="flag" size={16} color="#fff" />
            <Text style={styles.navBtnText}>Go to Drop-off</Text>
          </TouchableOpacity>
          {finalReturnLat && finalReturnLng && (
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#2196f3' }]}
              onPress={() => {
                openInGoogleMaps(finalReturnLat, finalReturnLng, returnLocation);
              }}
            >
              <Ionicons name="arrow-undo" size={16} color="#fff" />
              <Text style={styles.navBtnText}>Return</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16213e',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  routeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  routeDivider: { width: 1, height: 16, backgroundColor: '#ffffff40' },
  openMapsBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e94560',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  openMapsText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mapWrapper: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: '#fff', fontSize: 14 },
  myLocBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#fff',
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
  controls: {
    backgroundColor: '#16213e',
    padding: 16,
    gap: 8,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { color: '#ccc', fontSize: 13, flex: 1 },
  customerDetailsBox: { backgroundColor: '#0f3460', borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: '#2196f3' },
  customerDetailsTitle: { color: '#2196f3', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  detailLabel: { color: '#888', fontSize: 12, fontWeight: '600', minWidth: 50 },
  detailValue: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  callBtn: { backgroundColor: '#2196f3', borderRadius: 6, padding: 6, justifyContent: 'center', alignItems: 'center' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f3460', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  phoneText: { color: '#2196f3', fontSize: 13, fontWeight: '600', flex: 1 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  navBtn: {
    flex: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  navBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  disabledBtn: { opacity: 0.5 },
});
