import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [trips, setTrips] = useState(0);
  const [enquiries, setEnquiries] = useState(0);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [vendorTrips, setVendorTrips] = useState(0);
  const [hasActiveTrip, setHasActiveTrip] = useState(false);
  
  const continuousAlertRef = useRef(null);
  const hasPlayedInitialRef = useRef(false);
  const backgroundCheckRef = useRef(null);

  // Check if driver has an active/in-progress trip
  const checkActiveTrip = useCallback(async () => {
    if (!user?.id || !isDriverOnline) {
      setHasActiveTrip(false);
      return;
    }

    try {
      const { data: activeTrip, error } = await supabase
        .from('trips')
        .select('id')
        .in('status', ['accepted', 'in_progress'])
        .eq('accepted_by', user.id)
        .maybeSingle();

      if (!error) {
        setHasActiveTrip(!!activeTrip);
        console.log(`🚗 Active trip check: ${activeTrip ? 'HAS ACTIVE TRIP' : 'No active trip'}`);
      }
    } catch (err) {
      console.warn('Error checking active trip:', err.message);
    }
  }, [user?.id, isDriverOnline]);

  // Background check: periodically verify trips/enquiries exist
  const startBackgroundCheck = useCallback(() => {
    if (backgroundCheckRef.current) return;
    
    backgroundCheckRef.current = setInterval(async () => {
      try {
        if (!user?.id) return;
        
        // Check for active trip first
        await checkActiveTrip();
        
        // For drivers: check if they have available trips
        if (isDriverOnline) {
          const { data: tripsData, error: tripsError } = await supabase
            .from('trips')
            .select('id', { count: 'exact' })
            .eq('status', 'pending')
            .is('accepted_by', null);
          
          if (!tripsError && tripsData && tripsData.length > 0) {
            setTrips(tripsData.length);
            console.log(`🔄 Background check: ${tripsData.length} trips available`);
          }
        }
        
        // For vendors: check available enquiries
        const { data: enquiriesData, error: enquiriesError } = await supabase
          .from('enquiries')
          .select('id', { count: 'exact' })
          .eq('status', 'pending')
          .is('vendor_id', null);
        
        if (!enquiriesError && enquiriesData && enquiriesData.length > 0) {
          setEnquiries(enquiriesData.length);
          console.log(`🔄 Background check: ${enquiriesData.length} enquiries available`);
        }
        
        // For vendors: check their own published trips
        const { data: vendorTripsData, error: vendorTripsError } = await supabase
          .from('trips')
          .select('id', { count: 'exact' })
          .eq('created_by', user.id)
          .eq('status', 'pending')
          .is('accepted_by', null);
        
        if (!vendorTripsError && vendorTripsData && vendorTripsData.length > 0) {
          setVendorTrips(vendorTripsData.length);
          console.log(`🔄 Background check: ${vendorTripsData.length} vendor trips available`);
        }
      } catch (err) {
        console.warn('Background check error:', err.message);
      }
    }, 5000);
  }, [user?.id, isDriverOnline, checkActiveTrip]);

  const stopBackgroundCheck = useCallback(() => {
    if (backgroundCheckRef.current) {
      clearInterval(backgroundCheckRef.current);
      backgroundCheckRef.current = null;
    }
  }, []);

  // Main effect - NO SOUND, just track alert data
  useEffect(() => {
    const hasTripsOrEnquiries = trips > 0 || enquiries > 0 || vendorTrips > 0;
    const isDriver = trips > 0;
    const shouldCheckStatus = hasTripsOrEnquiries && !isMuted && (!isDriver || isDriverOnline) && !hasActiveTrip;

    if (shouldCheckStatus && !hasPlayedInitialRef.current) {
      console.log('📱 Alert data available (NO SOUND):', {
        trips,
        enquiries,
        vendorTrips
      });
      hasPlayedInitialRef.current = true;
      startBackgroundCheck();
    } else if (!shouldCheckStatus) {
      stopBackgroundCheck();
      hasPlayedInitialRef.current = false;
    }

    return () => {
      if (continuousAlertRef.current) {
        clearInterval(continuousAlertRef.current);
      }
    };
  }, [trips, enquiries, isMuted, vendorTrips, isDriverOnline, hasActiveTrip, startBackgroundCheck, stopBackgroundCheck]);

  // Memoized update function
  const updateAlertData = useCallback((data) => {
    if (data.trips !== undefined) setTrips(data.trips);
    if (data.enquiries !== undefined) setEnquiries(data.enquiries);
    if (data.isDriverOnline !== undefined) setIsDriverOnline(data.isDriverOnline);
    if (data.vendorTrips !== undefined) setVendorTrips(data.vendorTrips);
    
    console.log('🔔 AlertContext updated:', {
      trips: data.trips,
      enquiries: data.enquiries,
      vendorTrips: data.vendorTrips,
      isDriverOnline: data.isDriverOnline
    });
  }, []);

  // Handle driver going offline
  useEffect(() => {
    if (!isDriverOnline && trips > 0) {
      console.log('📴 Driver went offline');
      stopBackgroundCheck();
    }
  }, [isDriverOnline, trips, stopBackgroundCheck]);

  const value = {
    isMuted,
    setIsMuted,
    alertData: { trips, enquiries, isDriverOnline, vendorTrips },
    updateAlertData,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};
