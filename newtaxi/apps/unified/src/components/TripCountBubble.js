/**
 * TripCountBubble
 * Draggable floating circle showing available trip count.
 * 
 * Architecture note:
 * - Outer Animated.View: pan position (JS driver) — cannot use useNativeDriver
 * - Inner Animated.View: scale/pulse (native driver) — separate node, no conflict
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  AppState,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BUBBLE_SIZE = 64;
const DEFAULT_X = SCREEN_W - BUBBLE_SIZE - 16;
const DEFAULT_Y = SCREEN_H - BUBBLE_SIZE - 120;

export default function TripCountBubble({ tripCount = 0, isOnline = false, onPress }) {
  // JS-driven: position (cannot use native driver because it drives layout)
  const pan = useRef(new Animated.ValueXY({ x: DEFAULT_X, y: DEFAULT_Y })).current;

  // Native-driven: scale show/hide and pulse (separate node)
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const appStateRef = useRef(AppState.currentState);
  const [appInBackground, setAppInBackground] = useState(false);
  const pulseLoopRef = useRef(null);

  const shouldShow = tripCount > 0 && isOnline && !appInBackground;

  // Track app foreground/background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      setAppInBackground(nextState !== 'active');
    });
    return () => sub.remove();
  }, []);

  // Show/hide scale animation — native driver, separate node ✅
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: shouldShow ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: true,  // ✅ safe — scaleAnim is only used here
    }).start();
  }, [shouldShow]);

  // Pulse animation — native driver, separate node ✅
  useEffect(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }
    if (!shouldShow) {
      pulseAnim.setValue(1);
      return;
    }
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 650,
          useNativeDriver: true,  // ✅ safe — pulseAnim is only used here
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current.start();
    return () => {
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
      }
    };
  }, [shouldShow]);

  // PanResponder — JS driver (layout position cannot go native)
  const isDragging = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5) {
          isDragging.current = true;
        }
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        const snapX =
          pan.x._value < SCREEN_W / 2 ? 16 : SCREEN_W - BUBBLE_SIZE - 16;
        const clampY = Math.max(
          80,
          Math.min(pan.y._value, SCREEN_H - BUBBLE_SIZE - 80)
        );
        // Snap to edge — JS driver
        Animated.spring(pan, {
          toValue: { x: snapX, y: clampY },
          friction: 7,
          tension: 50,
          useNativeDriver: false,  // ✅ must be false for layout position
        }).start();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  if (!shouldShow) return null;

  return (
    // Outer: JS-driven position layer
    <Animated.View
      style={[
        styles.positionLayer,
        {
          transform: [
            { translateX: pan.x },  // JS driver
            { translateY: pan.y },  // JS driver
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Inner: native-driven scale/pulse layer — completely separate Animated.View */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],  // native driver ✅
        }}
      >
        {/* Pulse ring — another separate native node */}
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseAnim }] },  // native driver ✅
          ]}
          pointerEvents="none"
        />

        {/* Bubble button */}
        <TouchableOpacity
          style={styles.bubble}
          onPress={() => {
            if (!isDragging.current) onPress?.();
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="car" size={20} color="#fff" />
          <Animated.View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tripCount > 99 ? '99+' : tripCount}
            </Text>
          </Animated.View>
          <Text style={styles.label}>Trips</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  positionLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    zIndex: 9999,
  },
  pulseRing: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#e53935',
    opacity: 0.25,
    top: 0,
    left: 0,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#1a237e',
    borderWidth: 2.5,
    borderColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  label: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.3,
  },
});
