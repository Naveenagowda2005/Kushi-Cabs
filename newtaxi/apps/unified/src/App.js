import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';

console.log('=== APP STARTUP ===');
console.log('App.js: Module loading...');

// Check environment variables
console.log('App.js: Checking environment variables...');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✓ SET' : '✗ MISSING');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✓ SET' : '✗ MISSING');
console.log('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? '✓ SET' : '✗ MISSING');

export default function App() {
  console.log('App.js: Rendering App component...');

  React.useEffect(() => {
    console.log('App.js: useEffect - App mounted successfully');
    
    // Log any unhandled errors
    const errorHandler = (error) => {
      console.error('App.js: Unhandled error:', error);
    };
    
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
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  console.log('App.js: AppContent rendering...');
  
  return (
    <AuthProviderWrapper>
      <NavigationContainerWrapper />
    </AuthProviderWrapper>
  );
}

function AuthProviderWrapper({ children }) {
  console.log('App.js: AuthProviderWrapper rendering...');
  
  try {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  } catch (error) {
    console.error('App.js: Error in AuthProvider:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001a33' }}>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Auth Error: {error.message}
        </Text>
      </View>
    );
  }
}

function NavigationContainerWrapper() {
  console.log('App.js: NavigationContainerWrapper rendering...');
  
  try {
    return (
      <NavigationContainer
        onReady={() => console.log('App.js: Navigation ready')}
        onStateChange={() => console.log('App.js: Navigation state changed')}
      >
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    );
  } catch (error) {
    console.error('App.js: Error in NavigationContainer:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001a33' }}>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Navigation Error: {error.message}
        </Text>
      </View>
    );
  }
}
