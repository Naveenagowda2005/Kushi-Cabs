import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BUBBLE_SIZE = 100;
const BUBBLE_MARGIN = 16;

/**
 * Floating notification bubble like Rapido
 * Shows new trip notifications while app is in background
 * Draggable to move around, closeable, clickable to navigate
 */
export default function FloatingNotificationBubble({
  visible,
  trip,
  onPress,
  onClose,
  type = 'trip', // 'trip', 'enquiry', 'alert'
}) {
  const [position, setPosition] = useState({
    x: SCREEN_WIDTH - BUBBLE_MARGIN - BUBBLE_SIZE,
    y: SCREEN_HEIGHT - BUBBLE_MARGIN - BUBBLE_SIZE - 100,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const panResponderActive = useRef(false);
  const lastX = useRef(position.x);
  const lastY = useRef(position.y);

  useEffect(() => {
    if (visible) {
      // Slide in from right
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 80,
        friction: 20,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, slideAnim]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH + 100, 0],
  });

  const getIcon = () => {
    switch (type) {
      case 'trip':
        return { name: 'car', color: '#ff6b35' };
      case 'enquiry':
        return { name: 'clipboard', color: '#f77f00' };
      case 'alert':
        return { name: 'alert-circle', color: '#d62828' };
      default:
        return { name: 'bell', color: '#06a77d' };
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'trip':
        return 'New Trip!';
      case 'enquiry':
        return 'New Enquiry!';
      case 'alert':
        return 'Alert!';
      default:
        return 'Notification';
    }
  };

  const icon = getIcon();
  const title = getTitle();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }],
          position: 'absolute',
          right: BUBBLE_MARGIN,
          bottom: position.y < 0 ? BUBBLE_MARGIN : undefined,
          top: position.y >= 0 ? position.y : undefined,
        },
      ]}
    >
      {/* Main Bubble */}
      <TouchableOpacity
        style={styles.bubble}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: icon.color }]}>
          <Ionicons name={icon.name} size={28} color="#fff" />
          
          {/* Notification Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {trip?.pickup_location} → {trip?.dropoff_location}
          </Text>
          <Text style={styles.fare}>₹{trip?.fare_amount || 0}</Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Pulsing Animation Indicator */}
      <View style={[styles.pulse, { backgroundColor: icon.color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUBBLE_SIZE,
    zIndex: 9999,
  },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginRight: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    lineHeight: 14,
  },
  fare: {
    fontSize: 14,
    fontWeight: '700',
    color: '#06a77d',
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  pulse: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
});
