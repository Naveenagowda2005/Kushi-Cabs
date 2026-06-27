import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { playLoopingAlert, stopSound } from '../services/soundService';
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
  
  const continuousAlertRef = useRef(null);
  const hasPlayedInitialRef = useRef(false);
  const backgroundCheckRef = useRef(null);

  // Background check: periodically verify trips/enquiries exist
  // This ensures sound continues even if a screen doesn't update AlertContext
  const startBackgroundCheck = useCallback(() => {
    if (backgroundCheckRef.current) return; // Already running
    
    backgroundCheckRef.current = setInterval(async () => {
      try {
        if (!user?.id) return;
        
        // For drivers: check if they have available trips
        if (isDriverOnline) {
          const { data: tripsData, error: tripsError } = await supabase
            .from('trips')
            .select('id', { count: 'exact' })
            .eq('status', 'pending')
            .is('accepted_by', null);
          
          if (!tripsError && tripsData && tripsData.length > 0) {
            setTrips(tripsData.length);
            console.log(`🔄 Background check: ${tripsData.length} driver trips available`);
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
          console.log(`🔄 Background check: ${enquiriesData.length} vendor enquiries available`);
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
          console.log(`🔄 Background check: ${vendorTripsData.length} vendor published trips available`);
        }
      } catch (err) {
        console.warn('Background check error:', err.message);
      }
    }, 5000); // Check every 5 seconds
  }, [user?.id, isDriverOnline]);

  const stopBackgroundCheck = useCallback(() => {
    if (backgroundCheckRef.current) {
      clearInterval(backgroundCheckRef.current);
      backgroundCheckRef.current = null;
    }
  }, []);

  // Main effect to handle continuous alerting across all screens
  useEffect(() => {
    // Check if we have:
    // - trips (driver available trips)
    // - enquiries (vendor available enquiries)
    // - vendorTrips (vendor's own published trips)
    const hasTripsOrEnquiries = trips > 0 || enquiries > 0 || vendorTrips > 0;
    
    // For drivers: need to be online. For vendors: always ready
    const shouldPlayAlert = hasTripsOrEnquiries && !isMuted;

    if (shouldPlayAlert && !hasPlayedInitialRef.current) {
      console.log('🔔 Alert available - starting continuous ring');
      hasPlayedInitialRef.current = true;

      // Play alert IMMEDIATELY
      let alertType = 'enquiries';
      let rings = 3;
      if (trips > 0) {
        alertType = 'trips';
        rings = 2;
      } else if (vendorTrips > 0) {
        alertType = 'vendorTrips';
        rings = 3;
      }
      console.log(`📢 Alert type: ${alertType}, rings: ${rings}, trips: ${trips}, enquiries: ${enquiries}, vendorTrips: ${vendorTrips}`);
      playLoopingAlert(rings).catch(err => console.warn('Sound alert error:', err));

      // RESTART SOUND EVERY 5 SECONDS TO KEEP IT PLAYING ACROSS NAVIGATION
      continuousAlertRef.current = setInterval(() => {
        playLoopingAlert(rings).catch(err => console.warn('Sound restart error:', err));
      }, 5000);
    } else if (!shouldPlayAlert) {
      // Stop continuous alert
      if (continuousAlertRef.current) {
        console.log('🔇 Stopping continuous alert');
        clearInterval(continuousAlertRef.current);
        continuousAlertRef.current = null;
      }
      stopBackgroundCheck();
      hasPlayedInitialRef.current = false;
    }

    return () => {
      // Cleanup on unmount
      if (continuousAlertRef.current) {
        clearInterval(continuousAlertRef.current);
      }
    };
  }, [trips, enquiries, isMuted, vendorTrips, startBackgroundCheck, stopBackgroundCheck]);

  // Memoized update function to prevent re-renders
  const updateAlertData = useCallback((data) => {
    if (data.trips !== undefined) setTrips(data.trips);
    if (data.enquiries !== undefined) setEnquiries(data.enquiries);
    if (data.isDriverOnline !== undefined) setIsDriverOnline(data.isDriverOnline);
    if (data.vendorTrips !== undefined) setVendorTrips(data.vendorTrips);
  }, []);

  // Handle mute changes - stop sound when muted
  useEffect(() => {
    if (isMuted) {
      console.log('🔇 Mute activated - stopping sound');
      stopSound().catch(err => console.warn('Error stopping sound:', err));
    }
  }, [isMuted]);

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
