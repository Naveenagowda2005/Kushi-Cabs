import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  React.useEffect(() => {
    console.log('App mounted successfully');
    
    // Log any unhandled errors
    const errorHandler = (error) => {
      console.error('Unhandled error:', error);
    };
    
    const unhandledRejectionHandler = (reason) => {
      console.error('Unhandled promise rejection:', reason);
    };
    
    // These won't work in React Native, but let's try
    if (global.ErrorUtils) {
      global.ErrorUtils.setGlobalHandler(errorHandler);
    }
    
    return () => {
      if (global.ErrorUtils) {
        global.ErrorUtils.setGlobalHandler(null);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}