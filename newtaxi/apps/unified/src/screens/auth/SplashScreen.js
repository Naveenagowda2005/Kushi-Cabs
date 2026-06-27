import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { COLORS } from '../../constants';

export default function SplashScreen({ navigation }) {
  const gpsRing1 = useRef(new Animated.Value(0)).current;
  const gpsRing2 = useRef(new Animated.Value(0)).current;
  const gpsRing3 = useRef(new Animated.Value(0)).current;
  const gpsOpacity1 = useRef(new Animated.Value(1)).current;
  const gpsOpacity2 = useRef(new Animated.Value(1)).current;
  const gpsOpacity3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // GPS Ring 1 animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(gpsRing1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(gpsOpacity1, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(gpsRing1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
          Animated.timing(gpsOpacity1, {
            toValue: 1,
            duration: 0,
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();

    // GPS Ring 2 animation (delayed by 666ms)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(gpsRing2, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(gpsOpacity2, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(gpsRing2, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
            Animated.timing(gpsOpacity2, {
              toValue: 1,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ])
      ).start();
    }, 666);

    // GPS Ring 3 animation (delayed by 1332ms)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(gpsRing3, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(gpsOpacity3, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(gpsRing3, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
            Animated.timing(gpsOpacity3, {
              toValue: 1,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ])
      ).start();
    }, 1332);
  }, []);

  useEffect(() => {
    // Navigate to role selection after 2 seconds
    const timer = setTimeout(() => {
      if (navigation?.replace) {
        navigation.replace('RoleSelection');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  // GPS Ring 1 scale and opacity
  const ring1Scale = gpsRing1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.1],
  });

  // GPS Ring 2 scale and opacity
  const ring2Scale = gpsRing2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.1],
  });

  // GPS Ring 3 scale and opacity
  const ring3Scale = gpsRing3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.colorContainer}>
        {/* GPS Effect Container */}
        <View style={styles.gpsContainer}>
          {/* GPS Ring 1 */}
          <Animated.View
            style={[
              styles.gpsRing,
              {
                transform: [{ scale: ring1Scale }],
                opacity: gpsOpacity1,
              },
            ]}
          />

          {/* GPS Ring 2 */}
          <Animated.View
            style={[
              styles.gpsRing,
              {
                transform: [{ scale: ring2Scale }],
                opacity: gpsOpacity2,
              },
            ]}
          />

          {/* GPS Ring 3 */}
          <Animated.View
            style={[
              styles.gpsRing,
              {
                transform: [{ scale: ring3Scale }],
                opacity: gpsOpacity3,
              },
            ]}
          />

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../app.icon.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
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
  gpsContainer: {
    width: 460,
    height: 460,
    borderRadius: 230,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gpsRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#00d4ff',
    opacity: 1,
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
