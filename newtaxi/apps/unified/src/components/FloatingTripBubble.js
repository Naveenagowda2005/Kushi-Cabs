/**
 * Floating Trip Bubble Component
 * Shows an elegant floating bubble with active trip info
 * Similar to Rapido's UI design
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const BUBBLE_SIZE = 120;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * FloatingTripBubble Component
 * 
 * @param {Object} props
 * @param {Object} props.trip - Active trip data
 * @param {boolean} props.visible - Whether bubble is visible
 * @param {Function} props.onPress - Callback when bubble is pressed
 * @param {string} props.position - Position: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
 */
export default function FloatingTripBubble({
  trip,
  visible = false,
  onPress,
  position = 'bottom-right',
}) {
  const [fadeAnim] = useState(new Animated.Value(visible ? 1 : 0));
  const [scaleAnim] = useState(new Animated.Value(visible ? 1 : 0.5));
  const [pulseAnim] = useState(new Animated.Value(0));

  // Show/hide animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: visible ? 1 : 0.5,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fadeAnim, scaleAnim]);

  // Pulse animation (continuous)
  useEffect(() => {
    if (!visible) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [visible, pulseAnim]);

  if (!trip) return null;

  // Calculate position based on prop
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: 80, right: 20 };
      case 'bottom-left':
        return { bottom: 80, left: 20 };
      case 'top-right':
        return { top: 80, right: 20 };
      case 'top-left':
        return { top: 80, left: 20 };
      default:
        return { bottom: 80, right: 20 };
    }
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0.4],
  });

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
        getPositionStyles(),
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Pulse ring effect */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Main bubble */}
      <TouchableOpacity
        style={styles.bubble}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.bubbleContent}>
          {/* Trip status indicator */}
          <View style={styles.statusIndicator}>
            <Ionicons name="navigate-circle" size={24} color="#fff" />
          </View>

          {/* Trip info */}
          <View style={styles.tripInfo}>
            <Text style={styles.tripStatus}>Trip Active</Text>
            <Text style={styles.tripAmount}>
              ₹{trip.fare_amount ? trip.fare_amount.toFixed(2) : '0'}
            </Text>
          </View>

          {/* Tap indicator */}
          <View style={styles.tapIndicator}>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
        </View>

        {/* Pickup/Dropoff locations (appears on hover/touch) */}
        <View style={styles.locationPreview}>
          <View style={styles.locationItem}>
            <Ionicons name="location" size={12} color="#4caf50" />
            <Text style={styles.locationText} numberOfLines={1}>
              {trip.pickup_location}
            </Text>
          </View>
          <View style={styles.locationDivider} />
          <View style={styles.locationItem}>
            <Ionicons name="location" size={12} color="#ff6b6b" />
            <Text style={styles.locationText} numberOfLines={1}>
              {trip.dropoff_location}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Draggable indicator */}
      <View style={styles.dragHandle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  pulseRing: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#4caf50',
    top: 0,
    left: 0,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#1a1a2e',
    borderWidth: 3,
    borderColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bubbleContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  statusIndicator: {
    marginBottom: 2,
  },
  tripInfo: {
    alignItems: 'center',
  },
  tripStatus: {
    color: '#4caf50',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tripAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tapIndicator: {
    marginTop: 2,
  },
  locationPreview: {
    position: 'absolute',
    bottom: -100,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
    width: BUBBLE_SIZE + 40,
    marginLeft: -20,
    opacity: 0,
    // Would need to handle show on press with state
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#fff',
    fontSize: 10,
    flex: 1,
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#0f3460',
    marginVertical: 4,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 4,
    width: 24,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
});
