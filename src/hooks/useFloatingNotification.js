import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { notifyNewTrip } from '../services/notificationService';
import { notifyNewTripBackground, setupAppStateListener } from '../services/backgroundNotificationService';

/**
 * Hook to manage floating notification bubble display
 * Shows notification when app is in foreground and background
 */
export function useFloatingNotification() {
  const [visibleNotification, setVisibleNotification] = useState(null);
  const appStateRef = useRef(AppState.currentState);
  const notificationQueueRef = useRef([]);
  const hideTimerRef = useRef(null);

  // Listen to app state changes
  useEffect(() => {
    const unsubscribe = setupAppStateListener(
      () => {
        // App entering background
        appStateRef.current = 'background';
        console.log('📱 Background state detected');
      },
      () => {
        // App entering foreground
        appStateRef.current = 'active';
        console.log('📱 Foreground state detected');
        
        // Show any queued notifications
        if (notificationQueueRef.current.length > 0) {
          const notification = notificationQueueRef.current.shift();
          setVisibleNotification(notification);
        }
      }
    );

    return unsubscribe;
  }, []);

  /**
   * Show floating notification
   * @param {Object} trip - Trip data
   * @param {string} type - Type of notification: 'trip', 'enquiry', 'alert'
   */
  const showNotification = useCallback((trip, type = 'trip') => {
    console.log('🔔 Show notification triggered:', { tripId: trip?.id, type, appState: appStateRef.current });

    const notification = { trip, type };

    // If app is in background, send system notification instead
    if (appStateRef.current === 'background') {
      console.log('📤 App in background, sending system notification');
      notifyNewTripBackground(trip).catch(err => console.error('❌ Background notification error:', err));
    } else {
      // App is in foreground, show floating bubble
      console.log('🎈 Showing floating notification bubble');
      setVisibleNotification(notification);

      // Auto-hide after 8 seconds if not interacted
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setVisibleNotification(null);
      }, 8000);
    }
  }, []);

  /**
   * Hide current notification
   */
  const hideNotification = useCallback(() => {
    console.log('👋 Hiding notification');
    setVisibleNotification(null);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
  }, []);

  /**
   * Queue notification if user is in another screen
   */
  const queueNotification = useCallback((trip, type = 'trip') => {
    console.log('📋 Queueing notification:', trip.id);
    notificationQueueRef.current.push({ trip, type });
  }, []);

  /**
   * Get queued notification count
   */
  const getQueuedCount = useCallback(() => {
    return notificationQueueRef.current.length;
  }, []);

  /**
   * Clear notification queue
   */
  const clearQueue = useCallback(() => {
    console.log('🗑️ Clearing notification queue');
    notificationQueueRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return {
    visibleNotification,
    showNotification,
    hideNotification,
    queueNotification,
    getQueuedCount,
    clearQueue,
  };
}
