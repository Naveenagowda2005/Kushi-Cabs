import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import { COLORS } from '../../constants';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Navigate to role selection after 2 seconds
    const timer = setTimeout(() => {
      if (navigation?.replace) {
        navigation.replace('RoleSelection');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.colorContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#001a33',
  },
  logoContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 10,
  },
  logo: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
});
