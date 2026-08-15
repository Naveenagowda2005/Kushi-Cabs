import React from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useAnimatedBorder } from '../hooks/useAnimatedBorder';

/**
 * Animated Button Component with transitioning border colors
 * @param {string} variant - 'primary', 'secondary', or 'accent'
 * @param {function} onPress - Button press handler
 * @param {object} style - Additional styles
 * @param {React.ReactNode} children - Button content
 * @param {boolean} disabled - Disable button
 */
export const AnimatedButton = ({
  variant = 'primary',
  onPress,
  style,
  children,
  disabled = false,
  ...props
}) => {
  const borderColor = useAnimatedBorder(
    variant === 'primary' ? '#9333ea' : variant === 'secondary' ? 'rgba(255, 255, 255, 0.5)' : '#eab308',
    variant === 'primary' ? '#00d4ff' : variant === 'secondary' ? '#9333ea' : '#9333ea',
    2000
  );

  const baseStyle = {
    primary: {
      backgroundColor: 'rgba(147, 51, 234, 0.85)',
      borderRadius: 12,
      borderWidth: 2,
    },
    secondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      borderWidth: 2,
    },
    accent: {
      backgroundColor: 'rgba(234, 179, 8, 0.85)',
      borderRadius: 12,
      borderWidth: 2,
    },
  };

  return (
    <Animated.View
      style={[
        baseStyle[variant],
        {
          borderColor: borderColor,
          shadowColor: variant === 'primary' ? '#9333ea' : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 6,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AnimatedButton;
