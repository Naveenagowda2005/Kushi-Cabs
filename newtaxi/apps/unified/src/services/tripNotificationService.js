/**
 * tripNotificationService.js
 *
 * JS wrapper for the native TripNotification Android module.
 *
 * - Requests notification permission on first use
 * - Fires a heads-up notification with sound when new trips arrive and app is backgrounded
 * - Cancels notification when app comes to foreground or trips drop to 0
 * - Silently no-ops on Expo Go / iOS (native module won't be present)
 */

import { NativeModules, AppState, Platform } from 'react-native';

const { TripNotification } = NativeModules;
const isAvailable = Platform.OS === 'android' && !!TripNotification;

if (!isAvailable) {
  console.log('ℹ️ TripNotification native module not available — needs dev build.');
}

let permissionGranted = false;

/**
 * Request notification permission (Android 13+).
 * Call once when driver logs in / goes online.
 */
export const requestNotificationPermission = () => {
  if (!isAvailable) return Promise.resolve(false);
  return new Promise((resolve) => {
    TripNotification.requestPermission((granted) => {
      permissionGranted = !!granted;
      console.log(`🔔 Notification permission: ${permissionGranted ? 'granted' : 'denied'}`);
      resolve(permissionGranted);
    });
  });
};

/**
 * Show a heads-up notification alerting the driver about new trips.
 * Only fires when app is in background.
 * @param {number} tripCount
 */
export const showTripNotification = (tripCount) => {
  if (!isAvailable) return;
  if (tripCount <= 0) {
    TripNotification.cancelTripAlert();
    return;
  }
  // Only notify when app is backgrounded
  if (AppState.currentState !== 'active') {
    TripNotification.showTripAlert(tripCount);
    console.log(`🔔 Trip notification shown: ${tripCount} trips`);
  }
};

/**
 * Cancel the trip notification.
 * Call when app comes to foreground or driver accepts a trip.
 */
export const cancelTripNotification = () => {
  if (!isAvailable) return;
  TripNotification.cancelTripAlert();
  console.log('🔕 Trip notification cancelled');
};

/**
 * Setup all listeners in one call.
 * - Requests permission
 * - Cancels notification when app comes to foreground
 * - Returns cleanup function
 *
 * @returns {() => void} cleanup
 */
export const setupTripNotifications = async () => {
  if (!isAvailable) return () => {};

  await requestNotificationPermission();

  // Auto-cancel when driver brings app to foreground
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      cancelTripNotification();
    }
  });

  return () => sub.remove();
};
