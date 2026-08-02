/**
 * Floating Bubble Component - Like Rapido
 * Shows active trip info as a floating bubble
 * Works when app is in background or foreground
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const BUBBLE_SIZE = 120;

export default function FloatingBubble({ trip, visible = false, onPress }) {
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
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fadeAnim, scaleAnim]);

  // Pulse animation (continuous when visible)
  useEffect(() => {
    if (!visible) {
      pulseAnim.setValue(0);
      return;
    }

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

  if (!trip || !visible) return null;

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.2],
  });

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
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
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Ionicons name="navigate-circle" size={24} color="#fff" />
          <Text style={styles.label}>Active</Text>
          <Text style={styles.amount}>
            ₹{trip.fare_amount ? trip.fare_amount.toFixed(0) : '0'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Location hint on tap */}
      <View style={styles.locationHint}>
        <Text style={styles.locationText} numberOfLines={1}>
          {trip.pickup_location}
        </Text>
        <Ionicons name="arrow-forward" size={10} color="#4caf50" />
        <Text style={styles.locationText} numberOfLines={1}>
          {trip.dropoff_location}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 999,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    color: '#4caf50',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  locationHint: {
    position: 'absolute',
    top: -50,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    maxWidth: 80,
  },
});
