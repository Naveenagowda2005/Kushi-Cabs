import React, { createContext, useState, useContext, useCallback } from 'react';

const FloatingBubbleContext = createContext();

/**
 * FloatingBubbleProvider
 * Manages the state of the floating bubble (like Rapido)
 * Shows active trip info while driver is working
 */
export function FloatingBubbleProvider({ children }) {
  const [activeTrip, setActiveTrip] = useState(null);
  const [visible, setVisible] = useState(false);

  const showBubble = useCallback((trip) => {
    if (!trip) return;
    console.log('🫧 Showing floating bubble for trip:', trip.id);
    setActiveTrip(trip);
    setVisible(true);
  }, []);

  const hideBubble = useCallback(() => {
    console.log('🫧 Hiding floating bubble');
    setVisible(false);
    setActiveTrip(null);
  }, []);

  const updateBubble = useCallback((updates) => {
    setActiveTrip((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const value = {
    activeTrip,
    visible,
    showBubble,
    hideBubble,
    updateBubble,
  };

  return (
    <FloatingBubbleContext.Provider value={value}>
      {children}
    </FloatingBubbleContext.Provider>
  );
}

/**
 * Hook to use floating bubble context
 */
export function useFloatingBubble() {
  const context = useContext(FloatingBubbleContext);
  if (!context) {
    throw new Error('useFloatingBubble must be used inside FloatingBubbleProvider');
  }
  return context;
}
