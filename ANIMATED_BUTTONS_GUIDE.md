# Animated Button Border Transitions Guide

## Overview
All buttons now have animated border color transitions that cycle between 2 colors over 2 seconds, creating a dynamic, modern UI effect.

## Implementation

### Option 1: Using AnimatedButton Component (Recommended)
The easiest way to add animated borders to buttons:

```javascript
import { AnimatedButton } from '../components/AnimatedButton';

// Primary button (Purple ↔ Cyan)
<AnimatedButton
  variant="primary"
  onPress={() => handleLogin()}
  style={{ paddingVertical: 18, alignItems: 'center' }}
>
  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
    Login
  </Text>
</AnimatedButton>

// Secondary button (White ↔ Purple)
<AnimatedButton
  variant="secondary"
  onPress={() => handleSignUp()}
  style={{ paddingVertical: 18, alignItems: 'center' }}
>
  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
    Sign Up
  </Text>
</AnimatedButton>

// Accent button (Yellow ↔ Purple)
<AnimatedButton
  variant="accent"
  onPress={() => handleAction()}
  style={{ paddingVertical: 18, alignItems: 'center' }}
>
  <Text style={{ color: '#000', fontSize: 16, fontWeight: '600' }}>
    Action
  </Text>
</AnimatedButton>
```

### Option 2: Using useAnimatedBorder Hook
For custom button implementations:

```javascript
import { useAnimatedBorder } from '../hooks/useAnimatedBorder';
import { Animated, TouchableOpacity, Text } from 'react-native';

function CustomButton() {
  const borderColor = useAnimatedBorder('#9333ea', '#00d4ff', 2000);

  return (
    <Animated.View
      style={{
        borderColor: borderColor,
        borderWidth: 2,
        borderRadius: 12,
        backgroundColor: 'rgba(147, 51, 234, 0.85)',
      }}
    >
      <TouchableOpacity onPress={() => {}}>
        <Text>Custom Button</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
```

## Color Transitions

### Primary Button
- **Color 1**: `#9333ea` (Purple)
- **Color 2**: `#00d4ff` (Cyan)
- **Duration**: 2 seconds
- **Use Case**: Main actions (Login, Submit, Confirm)

### Secondary Button
- **Color 1**: `rgba(255, 255, 255, 0.5)` (White)
- **Color 2**: `#9333ea` (Purple)
- **Duration**: 2 seconds
- **Use Case**: Alternative actions (Sign Up, Cancel, Back)

### Accent Button
- **Color 1**: `#eab308` (Yellow)
- **Color 2**: `#9333ea` (Purple)
- **Duration**: 2 seconds
- **Use Case**: Special actions (Premium, Featured, Important)

## Files Modified/Created

### New Files
- `src/hooks/useAnimatedBorder.js` - Animation hook
- `src/components/AnimatedButton.js` - Reusable animated button component

### Updated Files
- `src/styles/glassomorphism.js` - Added button border animation config

## Migration Guide

### For Existing Buttons
Replace regular TouchableOpacity buttons with AnimatedButton:

**Before:**
```javascript
<TouchableOpacity style={[glassStyles.button, styles.loginButton]}>
  <Text>Login</Text>
</TouchableOpacity>
```

**After:**
```javascript
<AnimatedButton
  variant="primary"
  style={styles.loginButton}
  onPress={handleLogin}
>
  <Text>Login</Text>
</AnimatedButton>
```

## Performance Notes
- Animations use `useNativeDriver: false` for color interpolation (required for border colors)
- Each button instance has its own animation loop
- Minimal performance impact on modern devices
- Animations are automatically cleaned up on component unmount

## Customization

### Change Animation Duration
```javascript
const borderColor = useAnimatedBorder('#color1', '#color2', 3000); // 3 seconds
```

### Change Colors
```javascript
const borderColor = useAnimatedBorder('#ff0000', '#00ff00', 2000); // Red to Green
```

### Add to Existing Styles
```javascript
const animatedStyle = {
  ...glassStyles.button,
  borderColor: borderColor, // Override with animated value
};
```

## Browser/Device Support
- ✅ iOS 11+
- ✅ Android 5.0+
- ✅ Expo Go
- ✅ Web (React Native Web)

## Troubleshooting

### Animation Not Showing
- Ensure `borderWidth` is set to at least 2
- Check that `borderColor` is using the animated value
- Verify component is using `Animated.View` wrapper

### Performance Issues
- Reduce number of animated buttons on screen
- Increase animation duration if needed
- Use `shouldRasterizeIOS` for complex button content

### Color Not Transitioning Smoothly
- Ensure colors are in valid hex or rgba format
- Check that interpolation range matches animation values
- Verify animation duration is sufficient (minimum 1000ms recommended)
