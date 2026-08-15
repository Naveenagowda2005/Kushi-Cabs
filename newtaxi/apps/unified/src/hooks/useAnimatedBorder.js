import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook to create animated border color transitions between two colors
 * @param {string} color1 - First color (hex or rgba)
 * @param {string} color2 - Second color (hex or rgba)
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Animated.Value} - Animated value for border color interpolation
 */
export const useAnimatedBorder = (color1, color2, duration = 2000) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite loop animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: false,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: duration,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      animValue.setValue(0);
    };
  }, [animValue, duration]);

  // Interpolate between the two colors
  const borderColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [color1, color2],
  });

  return borderColor;
};

/**
 * Hook to create multiple animated borders for different button types
 * @returns {Object} - Object with animated border colors for different button types
 */
export const useAnimatedButtonBorders = () => {
  const primaryBorder = useAnimatedBorder('#9333ea', '#00d4ff', 2000);
  const secondaryBorder = useAnimatedBorder('rgba(255, 255, 255, 0.5)', '#9333ea', 2000);
  const accentBorder = useAnimatedBorder('#eab308', '#9333ea', 2000);

  return {
    primary: primaryBorder,
    secondary: secondaryBorder,
    accent: accentBorder,
  };
};
