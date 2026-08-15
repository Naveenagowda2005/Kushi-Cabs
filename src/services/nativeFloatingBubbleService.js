import { NativeModules, Platform } from 'react-native';

const FloatingBubbleModule = NativeModules.FloatingBubbleModule;

/**
 * Show the floating bubble overlay
 * Plays ring.mp3 sound on trip count increase
 * Shows vibration + visual feedback
 */
export const showFloatingBubble = (trip, tripCount = 1) => {
  if (Platform.OS !== 'android' || !FloatingBubbleModule) {
    console.warn('⚠️ Floating bubble not available on this platform');
    return;
  }

  try {
    console.log(`🫧 Showing floating bubble - Trip: ${trip?.id}, Count: ${tripCount}`);
    
    FloatingBubbleModule.showBubble({
      tripId: trip?.id,
      pickupLocation: trip?.pickup_location || 'Pickup',
      dropoffLocation: trip?.dropoff_location || 'Dropoff',
      fareAmount: trip?.fare_amount || 0,
      tripCount: tripCount,
      status: trip?.status || 'active',
    });
  } catch (error) {
    console.error('❌ Error showing floating bubble:', error);
  }
};

/**
 * Hide the floating bubble overlay
 */
export const hideFloatingBubble = () => {
  if (Platform.OS !== 'android' || !FloatingBubbleModule) {
    return;
  }

  try {
    console.log('🫧 Hiding floating bubble');
    FloatingBubbleModule.hideBubble();
  } catch (error) {
    console.error('❌ Error hiding floating bubble:', error);
  }
};

/**
 * Update trip count on the bubble
 * Triggers: ring.mp3 sound + vibration + badge animation
 */
export const updateTripCount = (count) => {
  if (Platform.OS !== 'android' || !FloatingBubbleModule) {
    return;
  }

  try {
    console.log(`🫧 Updating trip count: ${count} - Sound & Vibration triggered`);
    FloatingBubbleModule.updateTripCount(count);
  } catch (error) {
    console.error('❌ Error updating trip count:', error);
  }
};

/**
 * Request permission to show overlay
 */
export const requestOverlayPermission = async () => {
  if (Platform.OS !== 'android' || !FloatingBubbleModule) {
    return true;
  }

  try {
    console.log('🫧 Requesting overlay permission');
    const result = await FloatingBubbleModule.requestOverlayPermission();
    console.log(`🫧 Overlay permission: ${result ? '✅ Granted' : '❌ Denied'}`);
    return result;
  } catch (error) {
    console.error('❌ Error requesting overlay permission:', error);
    return false;
  }
};

/**
 * Check if overlay permission is already granted
 */
export const hasOverlayPermission = async () => {
  if (Platform.OS !== 'android' || !FloatingBubbleModule) {
    return true;
  }

  try {
    const result = await FloatingBubbleModule.hasOverlayPermission();
    console.log(`🫧 Has overlay permission: ${result}`);
    return result;
  } catch (error) {
    console.error('❌ Error checking overlay permission:', error);
    return false;
  }
};

export default {
  showFloatingBubble,
  hideFloatingBubble,
  updateTripCount,
  requestOverlayPermission,
  hasOverlayPermission,
};
