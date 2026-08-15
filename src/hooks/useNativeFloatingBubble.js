import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import {
  showFloatingBubble,
  hideFloatingBubble,
  updateTripCount,
  requestOverlayPermission,
  hasOverlayPermission,
} from '../services/nativeFloatingBubbleService';

export const useNativeFloatingBubble = (activeTrip, tripCount = 1) => {
  const appState = useRef(AppState.currentState);
  const hasPermission = useRef(false);
  const previousTripCount = useRef(tripCount);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const hasOverlay = await hasOverlayPermission();
        hasPermission.current = hasOverlay;
        
        if (!hasOverlay) {
          console.log('🫧 Requesting overlay permission...');
          await requestOverlayPermission();
        }
      } catch (error) {
        console.error('🫧 Error checking overlay permission:', error);
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (activeTrip?.status === 'in_progress' && tripCount !== previousTripCount.current) {
      console.log(`🫧 Trip count changed: ${previousTripCount.current} -> ${tripCount}`);
      updateTripCount(tripCount);
      previousTripCount.current = tripCount;
    }
  }, [tripCount, activeTrip?.status]);

  const handleAppStateChange = useCallback((nextAppState) => {
    if (activeTrip?.status === 'in_progress') {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🫧 App came to foreground - hiding bubble');
        hideFloatingBubble();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('🫧 App went to background - showing bubble');
        if (activeTrip) {
          showFloatingBubble(activeTrip, tripCount);
        }
      }
    }

    appState.current = nextAppState;
  }, [activeTrip, tripCount]);

  const showBubbleCallback = useCallback((trip) => {
    if (trip?.status === 'in_progress') {
      console.log(`🫧 Showing floating bubble for trip: ${trip.id}`);
      showFloatingBubble(trip, tripCount);
    }
  }, [tripCount]);

  const hideBubbleCallback = useCallback(() => {
    console.log('🫧 Hiding floating bubble');
    hideFloatingBubble();
  }, []);

  const updateCountCallback = useCallback((count) => {
    console.log(`🫧 Updating bubble trip count: ${count}`);
    updateTripCount(count);
  }, []);

  return {
    showBubble: showBubbleCallback,
    hideBubble: hideBubbleCallback,
    updateCount: updateCountCallback,
    hasPermission: hasPermission.current,
  };
};

export default useNativeFloatingBubble;
