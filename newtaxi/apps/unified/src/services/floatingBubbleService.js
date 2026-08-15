/**
 * floatingBubbleService.js
 *
 * JS wrapper for the native FloatingBubble Android module.
 * Shows a draggable circle over the home screen when the app is backgrounded.
 * Falls back silently on iOS or Expo Go (where native module isn't available).
 */

import { NativeModules, Platform, AppState } from 'react-native';

const { FloatingBubble } = NativeModules;

// Check if native module is available (only in dev build on Android)
const isAvailable = Platform.OS === 'android' && !!FloatingBubble;

if (!isAvailable) {
  console.log('ℹ️ FloatingBubble native module not available (Expo Go or iOS). Using fallback.');
}

/**
 * Request SYSTEM_ALERT_WINDOW permission if not granted.
 * Should be called once on app start for driver users.
 * @returns {Promise<boolean>} true if permission is granted
 */
export const requestOverlayPermission = () => {
  return new Promise((resolve) => {
    if (!isAvailable) return resolve(false);
    FloatingBubble.hasPermission((hasPermission) => {
      if (hasPermission) {
        resolve(true);
      } else {
        // Opens Android Settings → "Display over other apps"
        FloatingBubble.requestPermission();
        // Resolve false — user needs to grant and come back
        resolve(false);
      }
    });
  });
};

/**
 * Show the floating bubble over the home screen.
 * @param {number} tripCount - Number of available trips
 * @param {boolean} isOnline - Whether driver is online
 */
export const showFloatingBubble = (tripCount, isOnline) => {
  if (!isAvailable) return;
  if (tripCount > 0 && isOnline) {
    FloatingBubble.show(tripCount, isOnline);
    console.log(`🫧 Floating bubble shown: ${tripCount} trips`);
  } else {
    FloatingBubble.hide();
    console.log('🫧 Floating bubble hidden (no trips or offline)');
  }
};

/**
 * Hide the floating bubble.
 */
export const hideFloatingBubble = () => {
  if (!isAvailable) return;
  FloatingBubble.hide();
  console.log('🫧 Floating bubble hidden');
};

/**
 * Setup automatic show/hide based on AppState.
 * Call this once from your driver dashboard.
 *
 * @param {() => { tripCount: number, isOnline: boolean }} getState
 *   Callback that returns current trip count and online status
 * @returns {() => void} cleanup function
 */
export const setupAppStateListener = (getState) => {
  if (!isAvailable) return () => {};

  const handleAppStateChange = (nextAppState) => {
    const { tripCount, isOnline } = getState();
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background — show bubble if there are trips
      showFloatingBubble(tripCount, isOnline);
    } else if (nextAppState === 'active') {
      // App came back to foreground — hide bubble
      hideFloatingBubble();
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
};
