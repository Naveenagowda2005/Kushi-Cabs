import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Text,
} from 'react-native';
import { COLORS } from '../../constants';

export default function SplashScreen({ navigation }) {
  const gpsAnim1 = React.useRef(new Animated.Value(0)).current;
  const gpsAnim2 = React.useRef(new Animated.Value(0)).current;
  const gpsAnim3 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start GPS animations with staggered delays
    Animated.loop(
      Animated.sequence([
        Animated.timing(gpsAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(gpsAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
        Animated.delay(500),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(gpsAnim2, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(gpsAnim2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
        Animated.delay(500),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(gpsAnim3, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(gpsAnim3, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
        Animated.delay(500),
      ])
    ).start();

    // Navigate to role selection after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('RoleSelection');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  // GPS pulse interpolations - start from logo edge (220px)
  const gpsPulse1 = gpsAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 300],
  });

  const gpsPulse2 = gpsAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 380],
  });

  const gpsPulse3 = gpsAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 460],
  });

  const gpsOpacity1 = gpsAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const gpsOpacity2 = gpsAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const gpsOpacity3 = gpsAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.colorContainer,
          {
            backgroundColor: '#001a33',
          }
        ]}
      >
        {/* GPS Pulse Circles */}
        <Animated.View
          style={[
            styles.gpsPulse,
            {
              width: gpsPulse1,
              height: gpsPulse1,
              opacity: gpsOpacity1,
            }
          ]}
        />
        <Animated.View
          style={[
            styles.gpsPulse,
            {
              width: gpsPulse2,
              height: gpsPulse2,
              opacity: gpsOpacity2,
            }
          ]}
        />
        <Animated.View
          style={[
            styles.gpsPulse,
            {
              width: gpsPulse3,
              height: gpsPulse3,
              opacity: gpsOpacity3,
            }
          ]}
        />

        {/* Logo */}
        <View
          style={[
            styles.logoContainer,
          ]}
        >
          <Image
            source={require('../../../logo.jpeg')}
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
  },
  gpsPulse: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 3,
    borderColor: '#00d4ff',
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
