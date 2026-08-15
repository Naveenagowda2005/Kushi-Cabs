import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEWED_TRIPS_KEY = 'viewed_trips';

/**
 * Hook to manage and track viewed trips
 * Marks trips as new if they haven't been viewed by the driver
 */
export function useViewedTrips(driverId) {
  const [viewedTripIds, setViewedTripIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const storageOpInProgress = useRef(false);

  // Load viewed trip IDs from AsyncStorage on mount
  useEffect(() => {
    const loadViewedTrips = async () => {
      try {
        if (!driverId) {
          setIsLoading(false);
          return;
        }

        const key = `${VIEWED_TRIPS_KEY}_${driverId}`;
        const stored = await AsyncStorage.getItem(key);
        const ids = stored ? JSON.parse(stored) : [];
        setViewedTripIds(ids);
      } catch (error) {
        console.error('Error loading viewed trips:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadViewedTrips();
  }, [driverId]);

  // Mark trip as viewed
  const markAsViewed = useCallback(async (tripId) => {
    try {
      if (!driverId || !tripId || storageOpInProgress.current) return;

      const key = `${VIEWED_TRIPS_KEY}_${driverId}`;
      
      setViewedTripIds((prev) => {
        if (!prev.includes(tripId)) {
          const updated = [...prev, tripId];
          storageOpInProgress.current = true;
          AsyncStorage.setItem(key, JSON.stringify(updated)).finally(() => {
            storageOpInProgress.current = false;
          });
          return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error marking trip as viewed:', error);
    }
  }, [driverId]);

  // Mark all trips as viewed
  const markAllAsViewed = useCallback(async (tripIds) => {
    try {
      if (!driverId || !tripIds?.length || storageOpInProgress.current) return;

      const key = `${VIEWED_TRIPS_KEY}_${driverId}`;
      
      setViewedTripIds((prev) => {
        const newIds = tripIds.filter(id => !prev.includes(id));
        
        if (newIds.length > 0) {
          const updated = [...prev, ...newIds];
          storageOpInProgress.current = true;
          AsyncStorage.setItem(key, JSON.stringify(updated)).finally(() => {
            storageOpInProgress.current = false;
          });
          return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error marking all trips as viewed:', error);
    }
  }, [driverId]);

  // Check if trip is new (not viewed)
  const isNewTrip = useCallback((tripId) => !viewedTripIds.includes(tripId), [viewedTripIds]);

  return {
    viewedTripIds,
    isLoading,
    markAsViewed,
    markAllAsViewed,
    isNewTrip,
  };
}
