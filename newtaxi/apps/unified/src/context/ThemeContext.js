import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCurrentTheme } from '../constants';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
  const [isLoading, setIsLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render

  // Load theme preference from storage (always light mode)
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Always use light mode
        setIsDarkMode(false);
        setCurrentTheme(false);
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Theme toggle disabled - keep light mode only
  const toggleTheme = async () => {
    console.log('🎨 Light mode only - theme toggle disabled');
    // Do nothing, keep light mode
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isLoading, forceUpdate }}>
      {children}
    </ThemeContext.Provider>
  );
};
