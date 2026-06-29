import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCurrentTheme } from '../constants';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme !== null) {
          const theme = JSON.parse(savedTheme);
          setIsDarkMode(theme);
          setCurrentTheme(theme);
        } else {
          setCurrentTheme(true); // Default to dark
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Save theme preference when it changes
  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      setCurrentTheme(newTheme);
      setForceUpdate(prev => prev + 1); // Force all screens to re-render
      await AsyncStorage.setItem('theme_preference', JSON.stringify(newTheme));
      console.log(`🎨 Theme changed to ${newTheme ? 'Dark' : 'Light'} mode`);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isLoading, forceUpdate }}>
      {children}
    </ThemeContext.Provider>
  );
};
